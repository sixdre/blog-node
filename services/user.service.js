const NICKNAME_REGEXP = /^[(\u4e00-\u9fa5)0-9a-zA-Z\_\s@]+$/
const PASSWORD_REGEXP = /(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9]).{8,30}/

// 校验用户名
export const validateUserName = function(txt){
	if (txt == null || txt == "") { return false; }
    else {
        return NICKNAME_REGEXP.test(txt);
    }
}

//校验用户密码
export const validateUserPwd = function(txt){
	if (txt == null || txt == "") { return false; }
    else {
        return PASSWORD_REGEXP.test(txt);
    }
}
// var regex = new RegExp('');
// console.log(regex.test('a123456-'));