export default function validatePassword(req, res, next) {
    const {password} = req.body;

    const minLength = 6;

    if(!password || password.length < minLength){
        return res.status(400).json({message: "password는 최소 8자 이상이어야 합니다."})
    }
    next();
}