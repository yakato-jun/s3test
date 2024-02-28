const express = require('express');
const { S3Client, PutObjectCommand, ListObjectsCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const port = 3000;

const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY
  },
  forcePathStyle: true, // 必須。バケット名をパスの一部として使用
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: "my-bucket", // 事前にMinIOで作成するか、コード内で作成してください
    Key: file.originalname,
    Body: fileStream,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    res.send("File uploaded successfully.");
  } catch (err) {
    console.error("Error uploading file: ", err);
    res.status(500).send("Error uploading file.");
  }
});

app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
  <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" />
        <input type="submit" value="Upload" />
      </form>
    </body>
  </html>`;
  res.send(html);
});

app.get('/list', async (req, res) => {
  const listParams = {
    Bucket: "my-bucket",
  };

  try {
    const data = await s3Client.send(new ListObjectsCommand(listParams));

    let html = `<!DOCTYPE html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
      </head>
      <body>
        <ul>`;
      
    data.Contents.forEach((content) => {
      html += `<li><a href="/download?file=${content.Key}">${content.Key}</a></li>`;
    });

    html += `</ul>
      </body>
    </html>`;
    res.send(html);
  }
  catch (err) {
    console.error("Error listing objects: ", err);
    res.status(500).send("Error listing objects.");
  }
});


app.get('/download', async (req, res) => {
  const file = req.query.file;
  const downloadParams = {
    Bucket: "my-bucket",
    Key: file,
  };

  try {
    const data = await s3Client.send(new GetObjectCommand(downloadParams));
    const fileStream = data.Body;

    res.setHeader('Content-disposition', `attachment; filename=${file}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    fileStream.pipe(res);
  } catch (err) {
    console.error("Error downloading file: ", err);
    res.status(500).send("Error downloading file.");
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});