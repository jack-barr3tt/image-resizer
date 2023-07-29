"use client"
import { FormEvent, useState } from "react"

import browserImageSize from "browser-image-size"

const S3_ENDPOINT = "https://image-resizer-jb.s3.eu-west-2.amazonaws.com"
const DEFAULT_IMAGE = "not-found.jpeg"

export default function Resizer() {
  const [uploading, setUploading] = useState(true)
  const [imageID, setImageID] = useState<string>(DEFAULT_IMAGE)
  const [width, setWidth] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [preserveRatio, setPreserveRatio] = useState<boolean>(true)
  const [originalWidth, setOriginalWidth] = useState<number>(0)
  const [originalHeight, setOriginalHeight] = useState<number>(0)

  const uploadImage = async (file: File | null) => {
    if (!file) return

    const { url, fields } = await (
      await fetch("https://iomhshajirrbpo6xo3sxf5omdi0ukvmq.lambda-url.eu-west-2.on.aws/", {
        method: "POST",
      })
    ).json()

    const data: Record<string, any> = {
      ...fields,
      "Content-Type": file.type,
      file,
    }
    const formData = new FormData()
    for (const key in data) {
      formData.append(key, data[key])
    }

    await fetch(url, {
      method: "POST",
      body: formData,
    })

    const dimensions = await browserImageSize(file)
    setOriginalWidth(dimensions.width)
    setOriginalHeight(dimensions.height)
    setHeight("" + dimensions.height)
    setWidth("" + dimensions.width)

    setImageID(fields.key)

    setUploading(false)
  }

  const resizeImage = async (e: FormEvent<HTMLFormElement>) => {
    if (isNaN(parseInt(width)) || isNaN(parseInt(height))) return
    e.preventDefault()

    const data = await (
      await fetch("https://edxypu6krr55yh5y5toll5nlde0efayh.lambda-url.eu-west-2.on.aws/ ", {
        method: "POST",
        body: JSON.stringify({
          id: imageID,
          width: parseInt(width),
          height: parseInt(height),
          preserveRatio,
        }),
      })
    ).json()

    setImageID(data.id)
  }

  const cancelResize = () => {
    setUploading(true)
    setImageID(DEFAULT_IMAGE)
    setWidth("" + originalWidth)
    setHeight("" + originalHeight)
    setPreserveRatio(true)
  }

  const updateWidth = (e: FormEvent<HTMLInputElement>) => {
    setWidth(e.currentTarget.value)
    const val = parseInt(e.currentTarget.value)
    if (isNaN(val)) return
    if (preserveRatio) setHeight("" + (val * originalHeight) / originalWidth)
  }

  const updateHeight = (e: FormEvent<HTMLInputElement>) => {
    setHeight(e.currentTarget.value)
    const val = parseInt(e.currentTarget.value)
    if (isNaN(val)) return
    if (preserveRatio) setWidth("" + (val * originalWidth) / originalHeight)
  }

  return (
    <div className="pt-4 flex flex-row h-full">
      {uploading ? (
        <form className="flex flex-col">
          <label className="w-48 px-4 py-2 bg-blue-500 text-white text-center rounded-md shadow-md cursor-pointer">
            <span className="text-center w-full">Choose File</span>
            <input
              className="hidden"
              type="file"
              onChange={(e) => {
                uploadImage(e.target.files ? e.target.files[0] : null)
              }}
            />
          </label>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <img className="flex-auto" src={`${S3_ENDPOINT}/${imageID}`} />
          <form
            className="grid grid-cols-2 gap-4 outline outline-gray-300 rounded-2xl p-8"
            onSubmit={resizeImage}
          >
            <label htmlFor="preserve-ratio">Preserve Ratio</label>
            <div>
              <input
                type="checkbox"
                id="preserve-ratio"
                onChange={(e) => setPreserveRatio(e.target.checked)}
                checked={preserveRatio}
              />
            </div>
            <label htmlFor="width">Width</label>
            <input
              className="textbox"
              id="width"
              type="number"
              onChange={updateWidth}
              value={width}
            />
            <label htmlFor="height">Height</label>
            <input
              className="textbox"
              id="height"
              type="number"
              onChange={updateHeight}
              value={height}
            />
            <button className="btn-red" onClick={cancelResize}>
              Cancel
            </button>
            <button className="btn" type="submit">
              Resize
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
