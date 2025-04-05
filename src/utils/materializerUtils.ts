import SQLSealMaterializer from "src/main"


export const mapDataFromHeaders = (columns: string[], data: Record<string, any>[]) => {
    return data.map(d => columns.map(c => String(d[c])))
}

export const renderAsString = (data: Record<string, any>[], columns: string[], cellParser) => {
    return data.map(d => {
        const res: Record<string, string> = {}
        for (const col of columns) {
            const cell = cellParser.renderAsString(d[col])
            res[col] = formatCell(cell)
        }
        return res
    })
}

export const formatCell = (value: string): string => {
    // Escape the pipe character
    if (value.startsWith('[[')) {
        return value.replace(/\|/g, '\\|')
    } 

    // Change the checkboxes
    if (value === '[ ]' || value === ('[x]')) {
        const checked = value === ('[x]')
        
        if (SQLSealMaterializer.settings.checkboxType === 'html') {
            return `<input type='checkbox' ${checked ? 'checked' : ''}>`
        } else if (SQLSealMaterializer.settings.checkboxType === 'unicode') {
            return `${checked ? '☑' : '☐'}`
        } else { // markdown
            return value
        }
    }

    // Change the images
    if (value.startsWith('![[')) {
        return value.replace(/]]/g, `\\|${SQLSealMaterializer.settings.imgSize}]]`)
    }

    return value
}