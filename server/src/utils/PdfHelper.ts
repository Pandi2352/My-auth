var html_to_pdf = require('html-pdf-lts');
export class PDFHelper {
    static convertHTMLToPDF(html_content: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const options = {
                "height": "12.5in",
                "width": "15.5in"
            };

            html_to_pdf.create(html_content, options).toBuffer(function (err: Error | null, pdfBuffer: Buffer) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(pdfBuffer);
            });
        });
    }
}
