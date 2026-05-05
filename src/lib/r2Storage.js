import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const R2 = new S3Client({
  region:   'auto',
  endpoint: `https://${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET     = import.meta.env.VITE_R2_BUCKET_NAME
const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL

export async function uploadPhotos(logId, files) {
  return Promise.all(files.map((file, i) => uploadSingle(logId, file, i)))
}

async function uploadSingle(logId, file, index) {
  const compressed = await compressImage(file, 0.75)
  const key        = `maintenance_photos/${logId}/${index}_${file.name}`
  const buffer     = await compressed.arrayBuffer()

  await R2.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        new Uint8Array(buffer),
    ContentType: 'image/jpeg',
  }))

  return `${PUBLIC_URL}/${key}`
}

async function compressImage(file, quality = 0.75) {
  return new Promise((resolve) => {
    const img    = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target.result
      img.onload = () => {
        const MAX = 1200
        let { width, height } = img
        if (width > MAX)  { height = (height * MAX) / width;  width  = MAX }
        if (height > MAX) { width  = (width  * MAX) / height; height = MAX }

        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
      }
    }
    reader.readAsDataURL(file)
  })
}
