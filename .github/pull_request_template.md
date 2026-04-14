## 📝 Description of Changes
*Please concisely explain the architectural or physics changes introduced in this PR. Why is this change necessary? How does it improve the Physics Simulator ecosystem?*

## 🔗 Related Issues
*Provide a link to the relevant GitHub issue(s) this PR addresses.*
Closes: # [ISSUE_NUMBER]

## 🛠️ Type of Alteration
*Please select all that apply:*
- [ ] 🧪 **New Simulation Module:** (Added a physics visualization)
- [ ] 🐞 **Engine Bug Fix:** (Corrected mathematically inaccurate behavior or constraints)
- [ ] 💡 **UI/UX Refinement:** (Enhanced the DOM, styling, or Properties Panel)
- [ ] 📚 **Documentation / Theory Notebook:** (Added/fixed academic explanations)
- [ ] ⚡ **Performance Optimization:** (Improved tick rate or React rendering times)

## ✅ Pre-Merge Checklist:
*Please verify that your PR adheres to our contribution standards:*
- [ ] I have read the [Contributing Guidelines](CONTRIBUTING.md).
- [ ] I have strictly separated physics logic (Matter.js/custom math) from the React UI components where applicable.
- [ ] All new physical representations are backed by accurate formulas embedded in the `TheoryNotebook` or well-commented code.
- [ ] My code causes zero regression in high-velocity or extreme edge cases (e.g., testing masses approaching 0 or Infinity).
- [ ] I have executed `npm run dev` and verified the main UI renders without console errors or warnings.

## 📸 Visual Verification (If applicable)
*If your PR introduces visual changes (UI elements or new physical behavior), please attach screenshots or short GIFs demonstrating the functionality.*
[Drag & Drop Images/GIFs Here]
