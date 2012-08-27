(function($) {
  window.Album = Backbone.Model.extend({
    isFirstTrack: function(index) {
      return index == 0;
    },

    isLastTrack: function(index) {
      return index == this.get('tracks').length - 1;
    },

    trackUrlAtIndex: function(index) {
      if (this.get('tracks').length > index){
        return this.get('tracks')[index].url;
      }
      return null;
    }
  });

  window.Albums = Backbone.Collection.extend({
    model: Album,
    url: "/albums"
  });

  window.PlaylistAlbums = window.Albums.extend({

    isFirstAlbum: function(index){
      return index == 0;
    },

    isLastAlbum: function(index){
      return index == this.models.length - 1;
    }
  });

  window.Player = Backbone.model.extend({

    defaults: {
      'currentAlbumIndex': 0,
      'currentTrackIndex': 0,
      'state': 'stop'
    },

    initialize: function() {
      this.playlist = new PlaylistAlbums();
    },

    play: function(){
      this.set({state: 'play'});
    },

    pause: function(){
      this.set({state: 'pause'});
    },

    isPlaying: function(){
      return this.get('state') == 'play';
    },

    isStopped: function(){
      return !this.isPlaying();
    },

    currentAlbum: function(){
      return this.playlist.at(this.get('currentAlbumIndex'));
    },

    currentTrackUrl: function(){
      var album = this.currentAlbum();
      return album.trackUrlAtIndex(this.get('currentTrackIndex'));
    },

    nextTrack: function(){
      var album = this.currentAlbum();
      var currIndex = this.get('currentTrackIndex');
      var albumIndex = this.get('currentAlbumIndex');
      if (album.getTrackUrlAtIndex(currIndex + 1) != null){
        this.set({'currentTrackIndex': currIndex + 1});
        return;
      } else {
          this.set({'currentTrackIndex': 0});
          var nextAlbumIndex = null;
          if (!this.playlist.isLastAlbum(albumIndex)){
            nextAlbumIndex = albumIndex + 1;
          } else {
            nextAlbumIndex = 0;
          }
          this.set({'currentAlbumIndex': nextAlbumIndex});
      }
    },

    prevTrack: function(){
      var currIndex = this.get('currentTrackIndex');
      var albumIndex = this.get('currentAlbumIndex');

      if (this.currentAlbum.isFirstTrack(currIndex)) {
        if (this.playlist.isFirstAlbum(albumIndex)){
          this.set({'currentAlbumIndex': this.playlist.models.length - 1});
        } else {
          this.set({'currentAlbumIndex': albumIndex - 1});
        }
        this.set({'currentTrackIndex': this.currentAlbum().get('tracks').length() - 1});
      } else {
        this.set({'currentTrackIndex': currIndex - 1});
      }
    }


  });

  window.library = new Albums();
  window.player = new Player();

  window.AlbumView = Backbone.View.extend({

    tagName: 'li',
    className: 'album',
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.template = _.template($("#album-template").html());
    },

    render: function() {
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });


  window.LibraryAlbumView = AlbumView.extend({

    events: {
      'click .queue.add': 'select'
    },

    select: function(){
      this.collection.trigger('select', this.model);
      console.log("triggered select event");
    }

  });

  window.LibraryView = Backbone.View.extend({
    tagName: 'section',
    className: 'library',
    initialize: function() {
      _.bindAll(this, 'render');
      this.template = _.template($("#library-template").html());
      this.collection.bind('reset', this.render);
    },

    render: function() {
      var $albums,
      collection = this.collection;

      $(this.el).html(this.template({}));
      $albums = this.$('.albums');
      this.collection.each(function(album){
        var view = new LibraryAlbumView({
          model: album,
          collection: collection
        });
        $albums.append(view.render().el);
      });
      return this;
    }
  });

  window.BackboneTunes = Backbone.Router.extend({
    routes: {
      '': 'home',
      'blank': 'blank'
    },

    initialize: function(){
      this.libraryView = new LibraryView({
        collection: window.library
      });
    },

    home: function(){
      var $container = $("#container");
      $container.empty();
      $container.append(this.libraryView.render().el);
    },

    blank: function() {
      var $container = $("#container");
      $container.empty();
      $container.text('blank url')
    }
  });

  $(function() {
    window.App = new BackboneTunes();
    Backbone.history.start();
  });

})(jQuery);
