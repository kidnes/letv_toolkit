(function(window){
window.console || (console={log:function(){},dir:function(){},error:function(){}});

var ver = {
/*<VER>*/
/*<VER>*/
"_": "201212/22/lejs_0/"
};

window.__loadjs = function(js){
    document.write('<script type="text/javascript" src="http://js.letvcdn.com/js/'+(ver[js]||ver._).split('|')[0]+js+'.js"></script>');
};

location.href.indexOf('debug=1') > 0 &&
    document.write('<script src="https://trigger.io/catalyst/target/target-script-min.js#DA15F30B-B73D-4F41-AFA6-89276D5CF2BD"></script>');

try {
    document.domain = 'letv.com';
}catch(e){}
})(window);