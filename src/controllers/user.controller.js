import { asyncHandler } from '../utils/asyncHandler.js'

// const registerUser = asyncHandler( async (req, res) => {
//     return res.status(200).json({ message: "OK" })
// })

const registerUser = asyncHandler(async (req, res) => res.status(200).json({ message: "OK" }))

export { registerUser }