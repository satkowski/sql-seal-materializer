export const mapDataFromHeaders = (columns: string[], data: Record<string, any>[]) => {
    return data.map(d => columns.map(c => String(d[c])))
}