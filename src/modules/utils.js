function consoleColor(str,num){
    if (!num) {
        num = '32';
    }
    return "\033[" + num +"m" + str + "\033[0m"
}

function green(str){
    return consoleColor(str,32);
}

function yellow(str){
    return consoleColor(str,33);
}

function red(str){
    return consoleColor(str,31);
}

function blue(str){
    return consoleColor(str,34);
}

function purple(str){
    return consoleColor(str,36);
}

function merge(obj1, obj2, safe) {
    if (!obj2) {
        obj2 = {};
    };

    for (var attrname in obj2) {
        if (obj2.hasOwnProperty(attrname) && (!safe || !obj1.hasOwnProperty(attrname))) {
            obj1[attrname] = obj2[attrname];
        }
    }
    return obj1;
}

module.exports = {
    green: green,
    yellow: yellow,
    red: red,
    blue: blue,
    purple: purple,
    merge: merge
}