/**
 * 
 * @authors VickyFung
 * @date    2018-07-10 12:00:00
 * @version $A00$
 */

$(document).ready(function () {


	//获取音乐模块
	var getMusic = (function () {

		function GetMusic(node) {
			this.$base = node
			this.init()
			this.run()
		}

		GetMusic.prototype.init = function () {
			this.$audio = $("#audio")
			this.audio = $("#audio").get(0)

			this.Song = {}  // 获取的歌曲对象
			this.SongArr = []  // 用于保存歌曲，可以读取上一首
			this.channelID = 'public_tuijian_spring'

			this.autoPlayLock = true  //设置状态锁，控制是否播放，不加锁则歌曲加载完后会自动播放

			this.$songName = this.$base.find('.title .title-song')
			this.$singer = this.$base.find('.title .title-singer')

			this.$switch = this.$base.find('.switch')
			this.$prev = this.$base.find('.prev')
			this.$next = this.$base.find('.next')
			this.$needle = this.$base.find('.needle')
			this.$cdPlay = this.$base.find('.cd-play')
			this.$songImg = this.$base.find('.cd img')

			this.islyricShow = false
			this.lyricTimeArr = []  //用于保存每句歌词对应的秒数
			this.$lyricBtn = this.$base.find('.lyric-icon')
			this.$lyric = this.$base.find('.lyric')
			this.$cd = this.$base.find('.cd')
			// this.$lyricBox = this.$ct.find('.lyric-box')
		}

		GetMusic.prototype.run = function () {
			this.getSongInfo(this.channelID)

			this.canPlay()
			this.autoPlay()
			this.switch()

			this.prevSong()
			this.nextSong()

			this.needleChange()
			this.rotateCD()

		}


		// 获取某频道的随机歌曲信息
		GetMusic.prototype.getSongInfo = function (str) {  //参数为发送给服务器的数据，这里应该为channel的ID
			var self = this
			$.get('http://api.jirengu.com/fm/getSong.php', { channel: str }).done(function (data) {
				self.Song = JSON.parse(data).song[0]  // 将返回的信息变成一个包含歌曲信息的对象
				self.songRender(self.Song) //将歌曲渲染到页面
				self.SongArr.push(self.Song)  //将播放的歌曲保存在一个数组中，上一曲可以取到
			})
		}

		// 根据得到的歌曲对象，渲染到面板
		GetMusic.prototype.songRender = function (songInfo) {
			this.audio.src = songInfo.url
			this.$songName.text(songInfo.title)
			this.$singer.text(songInfo.artist)
			this.$songImg[0].src = songInfo.picture
			this.audio.load()  // 重新加载音频元素
			// this.audio.currentTime = 0
			// this.lyricReset(songInfo.sid)
		}

		// 数据足够时触发事件，播放已加载的歌曲
		GetMusic.prototype.canPlay = function () {
			var self = this
			// canplay 在媒体数据已经有足够的数据（至少播放数帧）可供播放时触发
			this.$audio.on('canplay', function () {
				if (self.autoPlayLock) {  //这里如果没有锁则当歌曲加载完会自动播放
					self.audio.play()
				}
				self.autoPlayLock = false  //将锁状态还原
			})
		}

		// 播放结束后触发事件，自动播放下一首
		GetMusic.prototype.autoPlay = function () {
			var self = this
			// ended 播放结束时触发
			this.$audio.on('ended', function () {
				self.autoPlayLock = true  //播放结束时，打开锁，保证canplay事件触发后能直接播放
				self.getSongInfo(self.channelId)
			})
		}


		// 播放暂停功能
		GetMusic.prototype.switch = function () {
			var self = this
			this.$switch.on('click', function () {
				if (self.audio.paused) { // 暂停播放的时候
					self.audio.play()
					if (self.$switch.hasClass('icon-bofang')) {
						self.$switch.removeClass('icon-bofang')
					}
					self.$switch.addClass('icon-zanting')
				} else {
					self.audio.pause()
					if (self.$switch.hasClass('icon-zanting')) {
						self.$switch.removeClass('icon-zanting')
					}
					self.$switch.addClass('icon-bofang')
				}
			})
			this.$audio.on('play', function () {
				if (self.$switch.hasClass('icon-bofang')) {
					self.$switch.removeClass('icon-bofang')
				}
				self.$switch.addClass('icon-zanting')
			})
			this.$audio.on('pause', function () {
				if (self.$switch.hasClass('icon-zanting')) {
					self.$switch.removeClass('icon-zanting')
				}
				self.$switch.addClass('icon-bofang')
			})
		}

		//上一曲，直接在原来保存的数组里面拿数据
		GetMusic.prototype.prevSong = function () {
			var self = this
			this.$prev.on('mousedown', function () {
				self.audio.pause()
			})
			this.$prev.on('click', function () {
				if (self.SongArr.length > 1) {
					self.autoPlayLock = true  //点击上一曲后，打开锁，保证canplay事件触发后能直接播放				
					self.SongArr.pop()
					self.songRender(self.SongArr[self.SongArr.length - 1])
				}
			})
		}

		//下一曲，发送请求给服务器，返回随机歌曲信息
		GetMusic.prototype.nextSong = function () {
			var self = this
			this.$next.on('mousedown', function () {
				self.audio.pause()
			})
			this.$next.on('click', function () {
				self.autoPlayLock = true  //点击下一曲后，打开锁，保证canplay事件触发后能直接播放
				self.getSongInfo(self.channelId)
			})
		}


		// 唱针状态控制
		GetMusic.prototype.needleChange = function () {
			var self = this
			this.$audio.on('play', function () {
				self.$needle.addClass('needle-play')
			})
			this.$audio.on('pause', function () {
				self.$needle.removeClass('needle-play')
			})
		}

		// 黑胶旋转控制
		GetMusic.prototype.rotateCD = function () {
			var self = this
			this.$audio.on('play', function () {
				// 该属性规定动画正在运行还是暂停，如果直接控制active会出现跳动
				self.$cdPlay.css('animation-play-state', 'running')
			})
			this.$audio.on('pause', function () {
				self.$cdPlay.css('animation-play-state', 'paused')
			})
		}

		

		return new GetMusic($('#ap'))
	})()

	//进度条控制模块
	var ProgressCtrl = (function(){
		function ProgressCtrl(node){
			this.$base = node
			this.init()
			this.run()
		}

		ProgressCtrl.prototype.init = function(){
			this.$progressBar = this.$base.find('.progress-bar')
			this.$progressDot = this.$base.find('.progress-dot')
			this.$progressLine = this.$base.find('.progress-line')
			this.$songTime = this.$base.find('.song-time')
			this.$currentTime = this.$base.find('.progress-time')
			
			this.$audio = $("#audio")
			this.audio = $("#audio").get(0)

			this.Song = {}  // 获取的歌曲对象
			// this.currentTime = 0

			// 设置句柄，控制拖曳
			this.drag = this.$progressDot.draggabilly({
				axis: 'x',  // 约束水平移动方向
				containment: true  // 其父元素为包含元素，控制拖动范围
			})	
		}

		ProgressCtrl.prototype.run = function(){
			this.dragCtrl()
			this.clickCtrl()
			this.timeUpdate()
		}

		//进度条拖拽控制
		ProgressCtrl.prototype.dragCtrl = function(){
			var self = this
			this.drag.on('dragMove',function(){
				var draggie = $(this).data('draggabilly')
				var proWidth = draggie.position.x + 'px'
				self.$progressLine.css('width',proWidth)

			})
			this.drag.on('dragStart',function(){
				self.audio.pause()
			})
			this.drag.on('dragEnd',function(){
				self.audio.play()
				var draggie = $(this).data('draggabilly')
				self.audio.currentTime = parseInt(draggie.position.x / 220 * self.audio.duration)
				console.log(self.audio.currentTime)
			})
		}

		ProgressCtrl.prototype.clickCtrl = function(){
			var self = this
			self.$progressBar.on('click',function(event){
				var proWidth = event.offsetX + 'px'
				self.$progressLine.css('width',proWidth)
				self.$progressDot.css('left',proWidth)
				self.audio.currentTime = parseInt(event.offsetX * self.audio.duration / 220)
				console.log(self.audio.currentTime)
			})
		}

		ProgressCtrl.prototype.timeUpdate = function(){

		}



		
		return new ProgressCtrl( $('.progress') )
	})()

})