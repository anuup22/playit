const asyncHandler = (requestHandler) => ((req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)) //requestHandler(req, res, next) -> stupid mistake
        .catch((err) => next(err))
    })
export { asyncHandler };

/*
const asyncHandler = () => {}
const asyncHandler = (fn) => () => {}
const asyncHandler = (fn) => async () => {}

const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    }
    catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: error.message,
        });
    }
}
*/