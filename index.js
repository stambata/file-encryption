const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const password = ')(&H(*B&^DFB^%';
const contentType = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
};
const redirect = (res) => {
    res.writeHead(302, {Location: '/'});
    return res.end();
};
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
require('http')
    .createServer((req, res) => {
        if (req.method === 'GET') {
            if (req.url === '/') {
                res.writeHead(200, {'content-type': 'text/html'});
                return res.end(
                    `<form action="/upload" enctype="multipart/form-data" method="post">
                        <input type="file" name="upload" multiple="multiple"><br>
                        <input type="submit" value="Upload">
                    </form>
                    </br>
                    ${fs.readdirSync(uploadsDir).map(file => `<a href='${file}'>${file}</a>`).join('</br>')}`
                );
            }
            let filePath = path.join(uploadsDir, req.url);
            return fs.exists(filePath, (exist) => {
                if (!exist || fs.statSync(filePath).isDirectory()) {
                    return redirect(res);
                }
                const r = fs.createReadStream(filePath);
                const decrypt = crypto.createDecipher(algorithm, password);
                res.setHeader('Content-type', contentType[path.parse(req.url.split('/').pop()).ext] || 'text/plain');
                r.pipe(decrypt).pipe(res);
            });
        }
        if (req.url === '/upload' && req.method === 'POST') {
            var busboy = new Busboy({ headers: req.headers });
            busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                const encrypt = crypto.createCipher(algorithm, password);
                const w = fs.createWriteStream(path.join(uploadsDir, path.basename(filename)));
                file.pipe(encrypt).pipe(w);
            });
            busboy.on('finish', () => redirect(res));
            return req.pipe(busboy);
        }
    })
    .listen(9999);
