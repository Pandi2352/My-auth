

import { CookieEntity } from "./CookieEntity";
import { HttpStatus } from "./httpStatus";
import { ResultEntityTypes } from "./ResultEntityTypes";
import { ErrorEntity } from "./ErrorEntity";

export class ResultEntity {
    success: boolean = false;
    code?: any;
    description?: string;
    data?: any;
    error?: any;
    meta_data?: any;
    content_type: string = ResultEntityTypes.json;
    cookies?: CookieEntity[];
    current_context: any;

    constructor({ sucess = false, code = undefined,
        description = undefined, data = undefined,
        meta_data = undefined, current_context = undefined }:
        {
            sucess?: boolean; code?: any; description?: string;
            data?: any; meta_data?: any; current_context?: any
        }) {
        this.success = sucess;
        this.code = code;
        this.description = description;
        this.data = data;
        this.meta_data = meta_data;
        this.current_context = current_context;
    }

    setData({ code = HttpStatus.OK,
        description = undefined,
        data = undefined,
        meta_data = undefined }: { code?: any; description?: string; data?: any; meta_data?: any; }) {
        this.success = true;
        this.code = code;
        this.data = data;
        this.description = description;
        this.meta_data = meta_data;
        this.content_type = ResultEntityTypes.json;
    }

    setDataDirect({ code = HttpStatus.OK, description = undefined, data = undefined, meta_data = undefined
    }: { code?: any; description?: string; data?: any; meta_data?: any; }) {
        this.success = true;
        this.code = code;
        this.data = data;
        this.description = description;
        this.meta_data = meta_data;
        this.content_type = ResultEntityTypes.json_direct;

    }

    setRedirect({ code = HttpStatus.FOUND, url = undefined, cookies = undefined }: { code?: any; url?: string; cookies?: any; }) {
        this.success = true;
        this.code = code;
        this.data = url;
        this.content_type = ResultEntityTypes.redirect;
        if (cookies) {
            this.cookies = cookies;
        }
    }

    setHTML({ code = HttpStatus.OK, html = undefined, cookies = undefined }: { code?: any; html?: string; cookies?: any; }) {
        this.success = true;
        this.code = code;
        this.data = html;
        this.content_type = ResultEntityTypes.html;
        if (cookies) {
            this.cookies = cookies;
        }
    }

    setCSS({ code = HttpStatus.OK, css = undefined, cookies = undefined }: { code?: any; css?: string; cookies?: any; }) {
        this.success = true;
        this.code = code;
        this.data = css;
        this.content_type = ResultEntityTypes.css;
        if (cookies) {
            this.cookies = cookies;
        }
    }

    setJS({ code = HttpStatus.OK, js = undefined, cookies = undefined }: { code?: any; js?: string; cookies?: any; }) {
        this.success = true;
        this.code = code;
        this.data = js;
        this.content_type = ResultEntityTypes.js;
        if (cookies) {
            this.cookies = cookies;
        }
    }

    setRawData({ code = HttpStatus.OK, raw_data = undefined, content_type = '', cookies = undefined }: { code?: any; raw_data?: string; content_type?: string, cookies?: any; }) {
        this.success = true;
        this.code = code;
        this.data = raw_data;
        this.content_type = content_type;
        if (cookies) {
            this.cookies = cookies;
        }
    }

    setError({ error = undefined }: { error?: ErrorEntity; }) {
        this.content_type = ResultEntityTypes.json;
        if (error) {
            if (error.toResponseEntity) {
                error.toResponseEntity(this);
            } else {
                this.code = HttpStatus.INTERNAL_SERVER_ERROR;
                this.error = error;
                console.log("", { message: error.message, stack: error.stack, error: error.error })
            }
        }
    }

    prepareResponse() {
        var anyThis: any = this
        delete anyThis.content_type;
    }

    setCookies(cookies: any[]) {
        this.cookies = cookies;
    }

    sendResponse(res: any) {
        var anyThis: any = this
        if (anyThis.current_context) {
            res.header('x-auth-req-id', anyThis.current_context.x_request_id)
            if (anyThis.current_context.out_cookies && anyThis.current_context.out_cookies.length > 0) {
                for (const cookie of anyThis.current_context.out_cookies) {
                    res.setCookie(
                        cookie.name, cookie.value, cookie.options
                    );
                }
            }
            delete anyThis.current_context;
        }


        if (this.content_type == ResultEntityTypes.redirect) {
            delete anyThis.content_type;
            res.code(anyThis.code).redirect(this.data!);
        } else if (anyThis.content_type == ResultEntityTypes.html) {
            delete anyThis.content_type;
            res.code(anyThis.code).header('Content-Type', "text/html; charset=UTF-8").send(anyThis.data);
        } else if (anyThis.content_type == ResultEntityTypes.json_direct) {
            delete anyThis.content_type;
            res.code(this.code).send(this.data);
        } else if (anyThis.content_type == ResultEntityTypes.css) {
            delete anyThis.content_type;
            res.code(anyThis.code).send(anyThis.data);
        } else if (anyThis.content_type == ResultEntityTypes.js) {
            delete anyThis.content_type;
            res.code(anyThis.code).header('Content-Type', 'application/javascript; charset=utf-8').send(anyThis.data);
        } else if (anyThis.content_type == ResultEntityTypes.json) {
            delete anyThis.content_type;
            res.code(this.code).send(this);
        } else if (anyThis.content_type) {
            const content_type = anyThis.content_type;
            delete anyThis.content_type;
            res.code(this.code).header('Content-Type', content_type).send(this.data);
        } else {
            delete anyThis.content_type;
            res.code(this.code).send(this);
        }
    }

}