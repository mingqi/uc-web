define(["jquery"],function(e){var t=e("#pleaseWaitDialog");return t.on("shown.bs.modal",function(){t.addClass("fade")}).on("hidden.bs.modal",function(){t.removeClass("fade")}),{wait:function(){t.modal()},done:function(){t.modal("hide")}}});