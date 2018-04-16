const NICKNAME_REGEXP = /^[(\u4e00-\u9fa5)0-9a-zA-Z\_\s@]+$/

export const validateUserName = function(txt){
	if (txt == null || txt == "") { return false; }
    else {
        return NICKNAME_REGEXP.test(txt);
    }
}