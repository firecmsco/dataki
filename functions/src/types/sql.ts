import { ServiceAccountKey } from "./service_account";

export type DataRow = {
    [key: string]: any;
};

export type FilterOp =
    | "<"
    | "<="
    | "=="
    | "!="
    | ">="
    | ">"
// | "array-contains"
// | "in"
// | "not-in"
// | "array-contains-any"
    ;

export type Filter = [string, FilterOp, unknown][];

export type OrderBy = [string, "asc" | "desc"][];

export interface SQLQuery {
    sql: string;
    credentials?: ServiceAccountKey;
    params?: DateParams;
    orderBy?: OrderBy;
    filter?: Filter;
    limit?: number;
    offset?: number;
}


export type DateParams = {
    dateStart?: Date | null;
    dateEnd?: Date | null;
}
