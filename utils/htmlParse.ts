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
    '<': new TokenType('<'),
    '>': new TokenType('>'),
    'tag': new TokenType('tag', {
        set: ['html', 'head', 'meta', 'title', 'style', ]
    }),
    'meta': new TokenType('meta'),
    'title': new TokenType('title'),
    'link': new TokenType('link'),
    'script': new TokenType('script'),
    'style': new TokenType('style'),
    'body': new TokenType('body'),
    'div': new TokenType('div'),
    'p': new TokenType('p'),
    'span': new TokenType('span'),
}