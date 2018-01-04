//生成tree数据
function transformTozTreeFormat (sNodes) {
	let setting = {idKey:'_id',parentKey:'pid',childKey:'child'};
    var i, l,
        key = setting.idKey,
        parentKey = setting.parentKey,
        childKey = setting.childKey;
    if (!key || key == "" || !sNodes) return [];

    if (Array.isArray(sNodes)&&sNodes.length) {
        var r = [];
        var tmpMap = {};
        for (i = 0, l = sNodes.length; i < l; i++) {
            tmpMap[sNodes[i][key]] = sNodes[i];
            if(!sNodes[i].permission) sNodes[i].permission=[]	//my add
        }
        for (i = 0, l = sNodes.length; i < l; i++) {
            if (tmpMap[sNodes[i][parentKey]] && sNodes[i][key] != sNodes[i][parentKey]) {
                if (!tmpMap[sNodes[i][parentKey]][childKey])
                    tmpMap[sNodes[i][parentKey]][childKey] = [];
                tmpMap[sNodes[i][parentKey]][childKey].push(sNodes[i]);
            } else {
                r.push(sNodes[i]);
            }
        }
        return r;
    } else {
        return [];
    }
}

export default transformTozTreeFormat;