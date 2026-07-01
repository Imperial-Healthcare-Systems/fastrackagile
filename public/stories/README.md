# Success Stories screenshots

The **Success Stories** page (`/#/stories`) builds its gallery from the image
files in this folder. Pick whichever option is easier:

## Option A — drop images + run the script (recommended, no renaming)

1. Copy your testimonial screenshot files into this folder
   (`Fastrack Agile/fastrack-next/public/stories/`). Any filenames are fine.
2. Right-click **`normalize-stories.ps1`** → **Run with PowerShell**.
   (It writes `manifest.json` listing your images — it does NOT rename or alter them.)
3. Refresh the Success Stories page (Ctrl+F5). Done.

To add/remove images later, drop/delete files and run the script again.

## Option B — name the files manually

Name the images `story-1.jpg`, `story-2.jpg`, … `story-32.jpg` (`.png` also works),
then refresh. No script needed. (Used automatically when there's no `manifest.json`.)

## Notes
- Order on the page follows the filename order (Option A) or the number (Option B).
- Keep files reasonably small (ideally < 400 KB each); exporting screenshots as
  JPG keeps the page fast.
- These screenshots are shown publicly — crop/blur anything that shouldn't be
  visible before saving the file.
