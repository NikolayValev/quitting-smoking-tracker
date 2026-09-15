const label = (category: string) =>
  category.charAt(0).toUpperCase() + category.slice(1)

/**
 * A tip's category, as one quiet chip.
 *
 * There used to be a colour per category, duplicated in two files, and it did
 * not work as a code: health and lifestyle were the same hue at 10% and 20%,
 * coping was a peach so pale it read as white, and motivation used the accent
 * token, which is a hover surface rather than a colour that means anything.
 * Five categories that cannot be told apart by colour are not colour-coded —
 * they are just tinted. The word already says which one it is.
 */
export function TipCategory({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {label(category)}
    </span>
  )
}

export { label as categoryLabel }
