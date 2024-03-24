import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false}) // we don't want to validate before saving

        return { accessToken, refreshToken };
    }
    catch(err){
        throw new ApiError(500, "Error generating tokens")
    }
}

// const registerUser = asyncHandler( async (req, res) => {
//     return res.status(200).json({ message: "OK" })
// })

//to register user, we need to check if the user already exists and then create the user
const registerUser = asyncHandler(async (req, res) => {
    // 1- get user details from front-end
    const { fullName, email, username, password } = req.body
    //console.log(fullName, email, username, password);

    // 2- validation - not empty, email format, password length
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    // 3- check if user already exists: username, email
    const existedUser = await User.findOne({ 
        $or: [{ email }, { username }] 
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);

    // 4- check for coverImage and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    // 5- upload images to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath) //we get entire response object from cloudinary
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null

    if(!avatar){
        throw new ApiError(400, "Error uploading avatar")
    }

    // 6- create user object - create user in db
    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || null
    })

    // 7- remove password and refreash token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8- check for user creation
    if(!createdUser){
        throw new ApiError(500, "Error creating user")
    }

    // 9- return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
})

//to login user, we need to check if the user exists and if the password is correct
const loginUser = asyncHandler(async (req, res) => {
    // 1- req.body -> data
    const {email, username, password} = req.body;

    // 2- login via email and username (for any one -> !(email || username))
    if(!email && !username){ 
        throw new ApiError(400, "Email or Username is required")
    }

    // 3- find the user
    const user = await User.findOne({  //findOne() is a mongoose method
        $or: [{ email }, { username }]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    // 4- compare password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials")
    }

    // 5- generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // 6- send secure cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") //optional 

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

//to logout user, we need to remove the refresh token from the user document
const logoutUser = asyncHandler(async (req, res) => {
    await User.findOneAndReplace(
        req.user._id, 
        { $set: { refreshToken: undefined }},
        { new: true }
    )
    // res.clearCookie("accessToken")
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, null, "User logged out successfully")
    )
    
})

//to refresh access token, we need to verify the refresh token and generate new access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Refresh Token Expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access Token Refreshed")
        )
    } 
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
        
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }