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
    // Change the checkboxes
    if (value === '[ ]' || value === ('[x]')) {
        const checked = value === ('[x]')
        
        if (SQLSealMaterializer.settings.checkboxType === 'html') {
            value = `<input type='checkbox' ${checked ? 'checked' : ''}>`
        } else if (SQLSealMaterializer.settings.checkboxType === 'unicode') {
            value = `${checked ? '☑' : '☐'}`
        }
    // Change the images
    } else if (value.startsWith('![[')) {
        value = value.replace(/]]/g, `|${SQLSealMaterializer.settings.imgSize}]]`)
    }

    // Escape the pipe character
    return value.replace(/\|/g, '\\|')
}