export default class DataTalkException extends Error {
    status: number;
    message: string;
    code?: string;
    data?: object;

    constructor(status: number, message: string, code?: string, data?: object) {
        super(message);
        this.status = status;
        this.message = message;
        this.code = code;
        this.data = data;
    }
}
