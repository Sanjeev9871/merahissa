# Image credits and licensing

Every photograph on this site comes from **Pexels**, under the
[Pexels License](https://www.pexels.com/license/), which permits commercial use
and modification and does not require attribution. Credit is recorded here
anyway, so that anyone auditing the site can verify the source rather than take
our word for it.

| File | Source | Photographer |
|---|---|---|
| `papers-in-order-*.webp` | [pexels.com/photo/6538576](https://www.pexels.com/photo/a-person-with-hand-on-the-file-folder-6538576/) | via Pexels |
| `guides-reading-*.webp` | [pexels.com/photo/192928](https://www.pexels.com/photo/stack-of-opened-books-on-wooden-table-192928/) | Madison Inouye, via Pexels |

Both are cropped and re-encoded to WebP. Originals are unmodified otherwise.

## Why these images, and not others

The Pexels License carries one restriction that matters more here than on most
sites: imagery may not be used **to imply endorsement of a product by the people
in it**. On a service that prepares estate paperwork, a photograph of an
identifiable person placed next to copy about bereavement reads as a customer —
and this site has committed, on its home page, not to invent customers.

So every image chosen leads with the **task** rather than a face: hands, papers,
files, a desk. None shows an identifiable person in a way that could be read as
a testimonial, and no caption anywhere describes a person in a photograph as a
customer, an heir, or a bereaved family member.

That rule is enforced by a test in `tests/invariants.test.ts` — alt text on these
images may not claim the subject is a customer.

## Adding an image later

1. Source it from Pexels or Unsplash. Both licences permit commercial use; check
   the specific photo page, because a handful of images carry extra restrictions.
2. Prefer the task over the person, for the reason above.
3. **Zoom to 100% and read every document in the frame before choosing it.**
   This is not optional and it is not paranoia. Of eleven candidates reviewed
   for this site, ten were rejected on inspection — one was a legible UK
   stillbirth registration form, one a Spanish-language form, one a file box
   labelled TOP SECRET FILES, one a fistful of US dollars. Any of them would
   have been mortifying on a page about a family's bereavement, and none was
   visible at thumbnail size.
4. Crop and encode with the same recipe used here: WebP, quality 80, at 1200px
   and 600px so the markup can carry a `srcset`.
5. Add a row to the table above. The credit is optional under the licence and
   mandatory in this repository.
