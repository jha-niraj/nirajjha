/**
 * Strips author-only `{/* … *\/}` blocks from a post body.
 *
 * Posts are named `.mdx`, but nothing here compiles MDX. The pipeline in
 * `data/blog.ts` is plain markdown: remark-parse, remark-gfm, remark-rehype.
 * MDX would treat `{/* … *\/}` as a JSX expression and drop it; remark sees an
 * unremarkable run of characters and renders it as prose. So a note written to
 * park a section, in the belief it was a comment, was being published in full:
 * on the page, in the `.md` source, and in `llms-full.txt`.
 *
 * Stripping here rather than switching the pipeline to MDX because the comment
 * syntax is the only MDX feature any post uses, and compiling MDX would mean
 * running every post through a JSX parser to get one thing we can do with a
 * regex.
 *
 * `scripts/blog-lint.mjs` does the same in `proseOnly()`. That is why the word
 * counts always looked right while the text was going out.
 */
const AUTHOR_COMMENT = /\{\/\*[\s\S]*?\*\/\}\s*/g;

export function stripAuthorComments(body: string): string {
	return body.replace(AUTHOR_COMMENT, "");
}
