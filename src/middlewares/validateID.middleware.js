export default function validateID(req, res, next) {
    const ID = req.body.ID;

    const minLength = 2;
    const maxLength = 20;
    const pattern = /^[a-z0-9]+$/;

    if(!ID || ID.length < minLength || ID.length > maxLength || !pattern.test(ID)){
        return res.status(400).json({message: "유효하지 않은 ID 입니다."})
    }
    next();
}