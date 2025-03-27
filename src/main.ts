import { Plugin } from "obsidian";
import { MDPrintRenderer } from "./renderer/mdPrintRenderer";
import { MDReplaceRenderer } from "./renderer/mdReplaceRenderer";
import { pluginApi } from "@vanakat/plugin-api";
import { SQLSealRegisterApi } from "@hypersphere/sqlseal";


export default class SQLSealMaterializer extends Plugin {
    async onload() {
        this.registerWithSQLSeal();
    }

    registerWithSQLSeal() {
        const api = pluginApi('sqlseal') as SQLSealRegisterApi
        const registar = api.registerForPlugin(this)
        
        registar.registerView('md-print', new MDPrintRenderer(this.app))
        // registar.registerView('md-replace', new MDReplaceRenderer(this.app))
    }
}