function init() {
    var x = 0;
    //console.log(pro);
    for (var i = 0; i < prizeslist.length; i++) {
        const prize = prizeslist[i];
        if (pro) {
            //console.log(pro);
            if ($("#" + prize._id).prop("checked")) {
                console.log(prize._id)
                $("#" + prize._id + prize.name).attr("value", pro.numList[x])
                x++
                $("#" + prize._id + prize.name).attr("disabled", false)
            }
            else {
                console.log("#" + prize._id + prize.name)
                $("#" + prize._id + prize.name).attr("disabled", true)
            }

        }

        $("#" + prize._id).click(function () {
            if ($(this).prop("checked")) {
                //console.log(prize._id)
                $("#" + prize._id + prize.name).attr("disabled", false)
            } else {
                //console.log("#" + prize._id + prize.name)
                $("#" + prize._id + prize.name).attr("disabled", true)
                
            }
        });


    }
}

$(function () {
    init()

})
