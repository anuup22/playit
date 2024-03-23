import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// const registerUser = asyncHandler( async (req, res) => {
//     return res.status(200).json({ message: "OK" })
// })

const registerUser = asyncHandler(async (req, res) => {
    //get user details from front-end
    const { fullName, email, username, password } = req.body
    //console.log(fullName, email, username, password);

    //validation - not empty, email format, password length
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    //check if user already exists: username, email
    const existedUser = await User.findOne({ 
        $or: [{ email }, { username }] 
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);

    //check for coverImage and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    //upload images to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath) //we get entire response object from cloudinary
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null

    if(!avatar){
        throw new ApiError(400, "Error uploading avatar")
    }

    //create user object - create user in db
    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || null
    })

    //remove password and refreash token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //check for user creation
    if(!createdUser){
        throw new ApiError(500, "Error creating user")
    }

    //return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
})

export { registerUser }