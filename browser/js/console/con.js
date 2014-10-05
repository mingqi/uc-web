(function() {
  var $modal = $('#pleaseWaitDialog');
  
  $modal
    .on('shown.bs.modal', function () { $modal.addClass('fade') })
    .on('hidden.bs.modal', function () { $modal.removeClass('fade') })

  var con = {
    wait: function() {
      $modal.modal();
    },
    done: function() {
      $modal.modal('hide');
    }
  };

  define(con);
})();