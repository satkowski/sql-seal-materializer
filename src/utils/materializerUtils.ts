import { console } from "inspector"
import { parse } from "json5"


export const mapDataFromHeaders = (columns: string[], data: Record<string, any>[]) => {
    return data.map(d => columns.map(c => String(d[c])))
}

export const parseSQLSealCustom = (input: string): string => {
    console.log(`Input: ${input}`)
    input = input.trim()
    if (!input.startsWith('SQLSEALCUSTOM'))
        return input

    const parsedData = parse(input.slice('SQLSEALCUSTOM('.length, -1))
    if (!(parsedData.type in SQLSealCustomParsers))
        return input

    return SQLSealCustomParsers[parsedData.type](parsedData)
}

const SQLSeal_link = (parsedData: any): string => {
    if (parsedData.values[1] === null)
        return `[[${parsedData.values[0]}]]`
    else
        return `[[${parsedData.values[0]}\\|${parsedData.values[1]}]]`
}

const SQLSeal_image = (parsedData: any): string => {
    return `![[${parsedData.values[0]}\\|200]]`
}

const SQLSeal_checkbox = (parsedData: any): string => {
    if (parsedData.values[0])
        return "<input type='checkbox' checked>"
    else
        return "<input type='checkbox'>"
    // return `<input type='checkbox'>${parsedData.values[0] ? '\n::after\n</input>' : ''}`
    // return `${parsedData.values[0] ? '☐' : '☑'}`
}

const SQLSealCustomParsers = {
    "a": SQLSeal_link,
    "img": SQLSeal_image,
    "checkbox": SQLSeal_checkbox
}