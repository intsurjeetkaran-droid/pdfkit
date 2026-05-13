# Organization Service

**Port:** 3007  
**Version:** 2.0.0  
**No auth required**  
**NEW in v2.0**

---

## Overview

Handles advanced page organization operations on PDFs. All operations use `pdf-lib` and run in-process (no external tools required).

---

## Routes

### POST /api/organize/reorder

Rearrange pages in a custom order.

```
Body: multipart/form-data
  file:  PDF
  order: "[3,1,2]"   (JSON array — page 3 first, then 1, then 2)

Response: reordered.pdf

Example:
  Original: [Page1, Page2, Page3]
  order=[3,1,2]
  Result:   [Page3, Page1, Page2]

Typical time: 50–300 ms
```

### POST /api/organize/duplicate

Duplicate specific pages (inserted right after the original).

```
Body: multipart/form-data
  file:  PDF
  pages: "[2,3]"   (JSON array — pages to duplicate)

Response: duplicated.pdf

Example:
  Original: [Page1, Page2, Page3]
  pages=[2]
  Result:   [Page1, Page2, Page2, Page3]

Typical time: 50–400 ms
```

### POST /api/organize/remove

Remove specific pages.

```
Body: multipart/form-data
  file:  PDF
  pages: "[1,4]"   (JSON array — pages to remove)

Response: pages-removed.pdf

Note: 400 if you try to remove all pages

Typical time: 50–300 ms
```

---

## Timing Logs

```
▶ organize-reorder started  { order: [3,1,2] }
✔ organize-reorder done     { totalMs: 87, totalSec: "0.09",
                              steps: [
                                { step: "read-file", ms: 12 },
                                { step: "parse-pdf", ms: 45 },
                                { step: "copy-pages", ms: 22 },
                                { step: "write-file", ms: 8 }
                              ] }
```

---

## Upload Limits

- Max file size: **100 MB**
- Allowed MIME: `application/pdf` only
