import { EmptyState, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { getPostAnalytics } from "@/db/analytics";
import { categoryLabel } from "@/lib/categories";
import { formatShortDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
	const rows = await getPostAnalytics();

	const totals = rows.reduce(
		(acc, r) => ({
			views: acc.views + r.views,
			likes: acc.likes + r.likes,
			comments: acc.comments + r.comments,
		}),
		{ views: 0, likes: 0, comments: 0 }
	);

	return (
		<>
			<PageHeader
				title="Posts"
				description="Every published post with its engagement. Sorted by views."
			/>

			{rows.length === 0 ? (
				<EmptyState
					title="No posts in the database"
					body="Run `pnpm blog:sync` to mirror the MDX files into the posts table."
				/>
			) : (
				<Table>
					<thead>
						<tr>
							<Th>Post</Th>
							<Th>Category</Th>
							<Th>Published</Th>
							<Th align="right">Views</Th>
							<Th align="right">Likes</Th>
							<Th align="right">Dislikes</Th>
							<Th align="right">Comments</Th>
						</tr>
					</thead>
					<tbody>
						{rows.map((p) => (
							<tr key={p.slug}>
								<Td>
									<Link
										href={`/admin/blogs/${p.slug}`}
										className="font-medium hover:underline"
									>
										{p.title}
									</Link>
									<span className="mt-0.5 block text-xs text-muted-foreground">
										/{p.slug} · {p.readingTime} min
									</span>
								</Td>
								<Td className="text-muted-foreground">
									{p.category ? categoryLabel(p.category) : "-"}
								</Td>
								<Td className="text-muted-foreground">
									{formatShortDate(p.publishedAt)}
								</Td>
								<Td align="right">{p.views.toLocaleString()}</Td>
								<Td align="right">{p.likes}</Td>
								<Td align="right">{p.dislikes}</Td>
								<Td align="right">{p.comments}</Td>
							</tr>
						))}
						<tr className="bg-muted/40 font-medium">
							<Td>Total</Td>
							<Td />
							<Td />
							<Td align="right">{totals.views.toLocaleString()}</Td>
							<Td align="right">{totals.likes}</Td>
							<Td align="right" />
							<Td align="right">{totals.comments}</Td>
						</tr>
					</tbody>
				</Table>
			)}
		</>
	);
}
