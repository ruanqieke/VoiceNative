
// 这段。。。
// fileUtils  对文件的读写操作
var radix = 12;
var base = 128 - radix;

function crypto(value) {
    value -= base;
    var h = Math.floor(value / radix) + base;
    var l = value % radix + base;
    return String.fromCharCode(h) + String.fromCharCode(l);
}

var encodermap = {}
var decodermap = {}
for (var i = 0; i < 256; ++i) {
    var code = null;
    var v = i + 1;
    if (v >= base) {
        code = crypto(v);
    } else {
        code = String.fromCharCode(v);
    }

    encodermap[i] = code;
    decodermap[code] = i;
}

// src_data => dst_data( 长度 + 数据)
function encode(data) {
    var content = "";
    var len = data.length;

    cc.log('encode, len=' + len + ', data=' + data);
    var a = (len >> 24) & 0xff;
    var b = (len >> 16) & 0xff;
    var c = (len >> 8) & 0xff;
    var d = len & 0xff;
    content += encodermap[a];
    content += encodermap[b];
    content += encodermap[c];
    content += encodermap[d];
    for (var i = 0; i < data.length; ++i) {
        content += encodermap[data[i]];
    }
    return content;
}

function getCode(content, index) {
    var c = content.charCodeAt(index);
    if (c >= base) {
        c = content.charAt(index) + content.charAt(index + 1);
    } else {
        c = content.charAt(index);
    }
    return c;
}

function decode(content) {
    var index = 0;
    var len = 0;
    for (var i = 0; i < 4; ++i) {
        var c = getCode(content, index);
        index += c.length;
        var v = decodermap[c];
        len |= v << (3 - i) * 8;
    }

    var newData = new Uint8Array(len);
    var cnt = 0;
    while (index < content.length) {
        var c = getCode(content, index);
        index += c.length;
        newData[cnt] = decodermap[c];
        cnt++;
    }
    return newData;
}

const AndroidClassName = "org/cocos2dx/javascript/VoiceRecorder";
const IosClassName = "VoiceSDK";

var VoiceNative = cc.Class({
    extends: cc.Component,

    properties: {
        // 读取地址
        _voiceMediaPath: null,
    },

    // use this for initialization
    onLoad: function () {

    },
    init: function () {
        if (cc.sys.isNative) {
            this._voiceMediaPath = jsb.fileUtils.getWritablePath() + "/voicemsgs/";
            this.setStorageDir(this._voiceMediaPath);
        }
    },

    // TOUCH_START
    prepare: function (filename) {
        if (!cc.sys.isNative) {
            return;
        }
        //暂停现在正在播放的所有音频
        cc.audioEngine.pauseAll();
        // 删除之前
        this.clearCache(filename);
        if (cc.sys.isNative) {
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod(AndroidClassName, "prepare", "(Ljava/lang/String;)V", filename);
            }
            else if (cc.sys.os == cc.sys.OS_IOS) {
                jsb.reflection.callStaticMethod(IosClassName, "prepareRecord:", filename);
            }
        }
    },
    //TOUCH_END
    release: function () {
        if (!cc.sys.isNative) {
            return;
        }
        cc.audioEngine.resumeAll();
        if (cc.sys.isNative) {
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod(AndroidClassName, "release", "()V");
            }
            else if (cc.sys.os == cc.sys.OS_IOS) {
                jsb.reflection.callStaticMethod(IosClassName, "finishRecord");
            }
        }
    },
    // TOUCH_CANCEL // 录音时间小于 1 秒
    cancel: function () {
        if (!cc.sys.isNative) {
            return;
        }
        cc.audioEngine.resumeAll();
        if (cc.sys.isNative) {
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod(AndroidClassName, "cancel", "()V");
            }
            else if (cc.sys.os == cc.sys.OS_IOS) {
                jsb.reflection.callStaticMethod(IosClassName, "cancelRecord");
            }
        }
    },
    //
    writeVoice: function (filename, voiceData) {
        if (!cc.sys.isNative) {
            return;
        }
        if (voiceData && voiceData.length > 0) {
            // var fileData = decode(voiceData);
            var url = this._voiceMediaPath + filename;
            this.clearCache(filename);
            jsb.fileUtils.writeDataToFile(voiceData, url);
        }
    },

    clearCache: function (filename) {
        if (cc.sys.isNative) {
            var url = this._voiceMediaPath + filename;
            //console.log("check file:" + url);
            if (jsb.fileUtils.isFileExist(url)) {
                //console.log("remove:" + url);
                jsb.fileUtils.removeFile(url);
            }
            if (jsb.fileUtils.isFileExist(url + ".wav")) {
                //console.log("remove:" + url + ".wav");
                jsb.fileUtils.removeFile(url + ".wav");
            }
        }
    },

    play: function (filename) {
        if (!cc.sys.isNative) {
            return;
        }
        cc.audioEngine.pauseAll();
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("org/cocos2dx/javascript/VoicePlayer", "play", "(Ljava/lang/String;)V", filename);
        }
        else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(IosClassName, "play:", filename);
        }
        else {
        }
    },

    // 读取用来发送;
    getVoiceData: function (filename) {
        if (cc.sys.isNative) {
            var url = this._voiceMediaPath + filename;
            console.log("getVoiceData:" + url);
            // 读取二进制文件 获取文件数据           
            var fileData = jsb.fileUtils.getDataFromFile(url);
            if (fileData) {
                // var content = encode(fileData);
                var content = fileData;
                return content;
            }
        }
        return "";
    },

    getDataString: function (data) {
        var content = encode(data);
        return content;
    },


    setStorageDir: function (dir) {
        if (!cc.sys.isNative) {
            return;
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(AndroidClassName, "setStorageDir", "(Ljava/lang/String;)V", dir);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(IosClassName, "setStorageDir:", dir);
            if (!jsb.fileUtils.isDirectoryExist(dir)) {
                jsb.fileUtils.createDirectory(dir);
            }
        }
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
VoiceNative = new VoiceNative();
module.exports = VoiceNative;
