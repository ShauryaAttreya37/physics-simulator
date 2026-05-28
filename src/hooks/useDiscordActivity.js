import { useEffect, useRef, useState } from 'react';

// Module-level singletons so re-renders and route transitions don't reinitialise.
let _sdk = null;
let _auth = null;
let _initPromise = null;

function isDiscordActivityLaunch() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.has('frame_id') && params.has('instance_id') && params.has('platform');
}

function getDiscordClientId() {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) {
    throw new Error('Missing VITE_DISCORD_CLIENT_ID');
  }

  return clientId;
}

async function initSdk() {
  const { DiscordSDK } = await import('@discord/embedded-app-sdk');

  // Not running inside Discord (local dev / regular browser visit) - skip handshake.
  if (!isDiscordActivityLaunch()) {
    return { sdk: null, auth: null };
  }

  const clientId = getDiscordClientId();

  if (!_sdk) {
    _sdk = new DiscordSDK(clientId);
  }

  await _sdk.ready();

  // Step 1 - get an authorization code.
  const { code } = await _sdk.commands.authorize({
    client_id: clientId,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify'],
  });

  // Step 2 - exchange the code for an access token via the proxied Vercel function.
  const res = await fetch('/.proxy/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status})`);
  }

  const { access_token } = await res.json();

  // Step 3 – authenticate the SDK session.
  _auth = await _sdk.commands.authenticate({ access_token });

  return { sdk: _sdk, auth: _auth };
}

/**
 * Initialises the Discord Embedded App SDK exactly once per page load.
 *
 * Returns:
 *   sdk    - DiscordSDK instance (null when not running inside Discord)
 *   auth   - auth result from sdk.commands.authenticate (null when not embedded)
 *   status - 'loading' | 'ready' | 'error'
 *   error  - error message string when status === 'error'
 */
export function useDiscordActivity() {
  const [status, setStatus] = useState('loading');
  const [auth, setAuth] = useState(_auth);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Already initialised in a previous render cycle.
    if (_auth !== null || (_sdk === null && _initPromise)) {
      _initPromise
        .then(() => {
          if (mountedRef.current) {
            setAuth(_auth);
            setStatus('ready');
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            setError(err?.message ?? 'Discord SDK error');
            setStatus('error');
          }
        });

      return () => {
        mountedRef.current = false;
      };
    }

    if (!_initPromise) {
      _initPromise = initSdk();
    }

    _initPromise
      .then(({ auth: a }) => {
        _auth = a;
        if (mountedRef.current) {
          setAuth(a);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err?.message ?? 'Discord SDK error');
          setStatus('error');
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { sdk: _sdk, auth, status, error };
}
