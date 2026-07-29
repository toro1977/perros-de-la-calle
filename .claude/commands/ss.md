---
description: Saca una captura del simulador iOS booteado y la revisa
---

Take a screenshot of the currently booted iOS simulator and review it:

1. Run `xcrun simctl io booted screenshot /tmp/perros-de-la-calle-sim.png` (overwrite the same path each time).
2. If the command errors because no simulator is booted, say so plainly and stop — don't guess which simulator to boot.
3. Read the resulting PNG so you can see it.
4. Give a short, concrete review of what's on screen: what screen/state it is, and anything that looks wrong (broken layout, wrong copy, missing data, off-brand colors) relative to what we're currently working on in this conversation. If nothing looks wrong, say so briefly — don't pad the response.

Keep the review tight. This is a quick visual check, not a full design audit.
