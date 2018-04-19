const eventObj={

};
eventObj.dragStart = function(ev){
    ev.dataTransfer.setData("url", ev.target.src);
    ev.dataTransfer.setData("id", ev.target.id);
    let url = ev.dataTransfer.getData("url");
};
eventObj.dragEnd = function(ev){
    let url = ev.path[0].currentSrc;
    let pos = {
        left: 10,
        top: 10,
        width: 100,
        height: 100,
        angle: 0
    };
    
};
export default eventObj;