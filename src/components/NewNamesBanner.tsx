interface Props {
  count: number
  authors: string[]
  onGo: () => void
}

function formatAuthors(authors: string[]): string {
  const unique = [...new Set(authors.filter(Boolean))]
  if (unique.length === 0) return ''
  if (unique.length === 1) return `de ${unique[0]}`
  if (unique.length === 2) return `de ${unique[0]} e ${unique[1]}`
  const others = unique.length - 2
  return `de ${unique[0]}, ${unique[1]} e mais ${others}`
}

export function NewNamesBanner({ count, authors, onGo }: Props) {
  const who = formatAuthors(authors)

  return (
    <button className="new-names-banner" onClick={onGo}>
      <span className="new-names-emoji">🎉</span>
      <span className="new-names-text">
        <strong>
          {count === 1 ? '1 novo nome para avaliação!' : `${count} novos nomes para avaliação!`}
        </strong>
        {who && <small>{who}</small>}
      </span>
      <span className="new-names-go" aria-hidden="true">
        ›
      </span>
    </button>
  )
}
