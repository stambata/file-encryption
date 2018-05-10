const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const password = '098F6BCD4621D373CADE4E832627B4F6';
const iv = Buffer.from('asdf*asdf8&12()!');
const contentType = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.pdf': 'application/pdf'
};
const redirect = (res) => {
    res.writeHead(302, {Location: '/'});
    return res.end();
};
const uploadsDir = path.join(__dirname, 'uploads');
const displayFiles = (dir) => {
    let files = fs.readdirSync(dir);
    if (!files.length) {
        return '';
    }
    return `<ul><h2>${dir}</h2>${files.map(file => {
        let filePath = path.join(dir, file);
        return fs.statSync(filePath).isDirectory()
            ? displayFiles(filePath)
            : `<li><a href='${dir.split('uploads').pop() + '\\' + file}'>${path.basename(filePath)}</a></li>`;
    }).join('')}</ul>`;
};
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
require('http')
    .createServer((req, res) => {
        if (req.method === 'GET') {
            if (req.url === '/') {
                res.writeHead(200, {'content-type': 'text/html'});
                return res.end(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="X-UA-Compatible" content="ie=edge">
                        <link href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABMLAAATCwAAAAAAAAAAAAAAAAAAAAAAAMHaxgC6078ByeLODdXp2gTd++QE4v3pFsfqzzG93sd6xuPSDcTj0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADJ69IA7v/0A7DaunWVzKJyuuXIJM7s2TKY0qu7m9CtlP///wf///8G////AP///wAAAAAAAAAAAAAAAAAAAAAA6P7uAP///wOz3b5NeMGL12+9h810vYnDcL6I94/LoZx6wo2Ch8ydnYjLmnGZ0qc5utvDDa3buADm9ukA////AbjiwyKWz6V9fb+Qq3K9itxes3T/X7Z6/3K/h/9itnr+VLVy/1m3eP9mvIH8g8eb2rjbxVyAwJUAAAAAAKzcuUZ+xJHRVbBv/UekZP9BnF7/Uqds/2a5fv94xI//isug74XKnbyGyJuqkM2jg5rVtEC53soRO5tkALLcv1N3wo/XWK9w82OvePRYqXH/RZxf/0WeX/9GnV7/Tqlq/1y6e/V4xJLGpNi1XvD69g3Y7+EAAAAAAAAAAACz2sN0j8uieHa3hUORxKGVX7F4/UumZv9LnmT/RJxf/02dZv9dunX/T7Rr/2W2fvCNzKR+2fDhC7ngxgAAAAAAu+DOAZTPpQCn2bYoY7V40EioY/9UqGz/XKx1/0ipZv9VpG/0gcKTwGC3efdSsmz/X7N59Z/Pqnr///8F2OzXANDu2wD///8Jk8ylm0yqaP9FoGH/e7yN+Wazfv1HqmX/UKtt5pTJpEaIxpqeX7d59EyuZv9pt4Dfrtu6MpzSqwCw2LsAzubVE225gsNCn17/Zat836/XuoJqt4LmRqhj/1uydemJxpst0+XUDJjMpmN2u429bbmE7JbPpo/e7eYKo86vALjcwjRiqnjkaK984aPQs1LP59Mhcb6Gz0apYv9ftHvpotOvLZbNpgD///8Bz+TXEqPasT2r17poyOLTJIrEmwCRy6FCerOLsKDNrT7///8B1ezXEHi+jcBHpmP/aLaB6LnfwC2m1bEAAAAAAAAAAADP5doA0eLcAM3p2QGx2sEAsdvCKbPawTCPyKUAzOnRAP///wSAwJaUSaZn/3S7iMTY8dkYvOLCAAAAAAAAAAAAAAAAAAAAAAAAAAAA+v//APn//wL9//8C+///AAAAAACPyaQAntCxTWK0e/CHxJSG////At3n2wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAu+HHAMvq1RGVy6W1o9WvaZrPqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOD25wD///8CwOPJYMDiyUq+4cgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4B8AAOAPAADgAQAAgAEAAIABAAAABwAAAAMAAEABAACAAQAAgAAAAIAgAACAPAAAmD8AAJw/AAD8fwAA/H8AAA==" rel="icon" type="image/x-icon" />
                        <title>Document</title>
                    </head>
                    <body>
                        <form action="/upload" enctype="multipart/form-data" method="post">
                            <input type="file" name="upload" multiple="multiple" style="border: 1px solid #EEE">
                            <input type="submit" value="Upload">
                        </form>
                        ${displayFiles(uploadsDir)}
                    </body>
                    </html>`
                );
            }
            const filePath = path.join(uploadsDir, req.url);
            return fs.exists(filePath, exist => {
                if (!exist) {
                    return redirect(res);
                }
                return fs.stat(filePath, (err, stat) => {
                    if (err || stat.isDirectory()) {
                        return redirect(res);
                    }
                    const r = fs.createReadStream(filePath);
                    const decrypt = crypto.createDecipheriv(algorithm, password, iv);
                    res.setHeader('Content-type', contentType[path.parse(req.url.split('/').pop()).ext] || 'text/plain');
                    r.pipe(decrypt).pipe(res);
                });
            });
        }
        if (req.url === '/upload' && req.method === 'POST') {
            const busboy = new Busboy({ headers: req.headers });
            busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                const encrypt = crypto.createCipheriv(algorithm, password, iv);
                const w = fs.createWriteStream(path.join(uploadsDir, path.basename(filename)));
                file.pipe(encrypt).pipe(w);
            });
            busboy.on('finish', () => {
                return res.end('file successfully uploaded!');
            });
            return req.pipe(busboy);
        }
    })
    .listen(9999);
