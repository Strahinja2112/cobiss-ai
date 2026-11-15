export function displayAuthorNames(authors: string[]) {
  return authors
    .map((author) => {
      const primary = author.split(/\s*=\s*/)[0]?.trim();
      return primary ?? author;
    })
    .join(" · ");
}

export function displayBookTitle(title: string) {
  return title.replace(/\s+([,:;])/g, "$1");
}
