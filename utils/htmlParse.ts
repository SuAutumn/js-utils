type AnyObject = Record<string, any>

class HtmlParse {
    private offset = 0
    private readonly len: number
    private stack = <string[]>[]
    private html = ''

    constructor(html: string) {
        this.len = html.length
        this.html = html
    }

    parse() {

        while (this.offset < this.len) {

        }
    }

    unit() {

    }

}


class TokenType {
    private label: string;

    constructor(label: string, conf?: AnyObject) {
        this.label = name
    }

}

const types = {

}