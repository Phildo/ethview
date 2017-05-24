var GamePlayScene = function(game, stage)
{
  var self = this;

  var canv = stage.drawCanv;
  var canvas = canv.canvas;
  var ctx = canv.context;
  var cam = {wx:0,wy:0,ww:canv.width/canv.height,wh:1};

  var hoverer;
  var dragger;
  var clicker;
  var keyer;

  var sec = 1;
  var min = sec*60;
  var hr  = min*60;
  var day = hr*24;
  var week = day*7;
  var month = day*30;
  var year = day*365;

  var red = "#AA0000";
  var green = "#00AA00";
  var blue = "#008844";
  var black = "#000000";
  var white = "#FFFFFF";

  var appname = "coinview";
  var ETH = "ETH";
  var BTC = "BTC";
  var LTC = "LTC";
  var eth_graph;
  var btc_graph;
  var ltc_graph;
  var my_graph;
  var graph_cover;

  var eth_btn;
  var btc_btn;
  var ltc_btn;
  var hr_btn;
  var day_btn;
  var week_btn;
  var month_btn;
  var load_latest_btn;
  var enhance_btn;

  var keys;

  var hover_xval;
  var hover_yval;
  var hover_pos;
  var drag_xval;

  var block_n = 2000;
  var loading_latest = false;
  var enhancing = false;

  var left_val;
  var right_val;

  var alignGraphs = function()
  {
    eth_graph.disp_min_xv = my_graph.disp_min_xv;
    eth_graph.disp_max_xv = my_graph.disp_max_xv;
    btc_graph.disp_min_xv = my_graph.disp_min_xv;
    btc_graph.disp_max_xv = my_graph.disp_max_xv;
    ltc_graph.disp_min_xv = my_graph.disp_min_xv;
    ltc_graph.disp_max_xv = my_graph.disp_max_xv;
  }

  var limitGraph = function()
  {
    if(my_graph.disp_max_xv > my_graph.xv[my_graph.xv.length-1])
    {
      my_graph.disp_min_xv -= my_graph.disp_max_xv-my_graph.xv[my_graph.xv.length-1];
      my_graph.disp_max_xv = my_graph.xv[my_graph.xv.length-1];
    }
    if(my_graph.disp_min_xv > my_graph.disp_max_xv-hr)   my_graph.disp_min_xv = my_graph.disp_max_xv-hr;
    if(my_graph.disp_min_xv < my_graph.disp_max_xv-year) my_graph.disp_min_xv = my_graph.disp_max_xv-year;
    alignGraphs();
    my_graph.dirty = true;
  }

  var getDataPt = function(ts,graph,callback)
  {
    var from = graph.coin;
    var to = "USD";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
      if(xhr.readyState == 4)
      {
        if(xhr.status == 200)
        {
          var r = JSON.parse(xhr.responseText);
          if(r && r[from] && r[from][to])
          {
            graph.insertDataNext(ts,r[from][to],0);
            callback();
          }
        }
      }
    }
    xhr.open("GET","https://min-api.cryptocompare.com/data/pricehistorical?fsym="+from+"&tsyms="+to+"&ts="+ts+"&extraParams="+appname,true);
    xhr.send();
  }

  var ENUM = 0;
  var BLOCK_DAY    = ENUM; ENUM++;
  var BLOCK_MINUTE = ENUM; ENUM++;
  var BLOCK_HOUR   = ENUM; ENUM++;
  var getDataBlock = function(block,coin,graph,n,callback)
  {
    var span = "day";
    switch(block)
    {
      case BLOCK_DAY:    span = "day";    break;
      case BLOCK_MINUTE: span = "minute"; break;
      case BLOCK_HOUR:   span = "hour";   break;
    }

    var from = coin;
    var to = "USD";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
      if(xhr.readyState == 4)
      {
        if(xhr.status == 200)
        {
          var r = JSON.parse(xhr.responseText);

          if(r && r.Data && r.Data.length)
          {
            var x = [];
            var y = [];
            for(var i = 0; i < r.Data.length; i++)
            {
              x[i] = r.Data[i].time;
              y[i] = r.Data[i].close;
            }
            graph.insertDataBlockNext(x,y,0);
            callback(graph);
          }
        }
      }
    }
    xhr.open("GET","https://min-api.cryptocompare.com/data/histo"+span+"?fsym="+from+"&tsym="+to+"&limit="+n+"&aggregate=1&extraParams="+appname,true);
    xhr.send();
  }

  self.ready = function()
  {
    hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});
    clicker = new Clicker({source:stage.dispCanv.canvas});
    keyer = new Keyer({source:stage.dispCanv.canvas});

    hover_pos = {x:0,y:0};

    if(purchases)
    {
      if(purchases.ETH)
      {
        for(var i = 0; i < purchases.ETH.length; i++)
        {
          purchases.ETH[i].ts = new Date(purchases.ETH[i].date);
          purchases.ETH[i].ts = floor(purchases.ETH[i].ts/1000)+2*hr;
        }
      }
      if(purchases.BTC)
      {
        for(var i = 0; i < purchases.BTC.length; i++)
        {
          purchases.BTC[i].ts = new Date(purchases.BTC[i].date);
          purchases.BTC[i].ts = floor(purchases.BTC[i].ts/1000)+2*hr;
        }
      }
      if(purchases.LTC)
      {
        for(var i = 0; i < purchases.LTC.length; i++)
        {
          purchases.LTC[i].ts = new Date(purchases.LTC[i].date);
          purchases.LTC[i].ts = floor(purchases.LTC[i].ts/1000)+2*hr;
        }
      }
    }

    keys = new function()
    {
      var self = this;
      self.shift = false;
      self.alt = false;
      self.cmd = false;
      self.key_down = function(evt)
      {
        console.log(evt.keyCode);
        var delta;
        switch(evt.keyCode)
        {
          case 16: //shift
            self.shift = true;
          break;
          case 18: //alt
            self.alt = true;
            var index = my_graph.findibeforex(my_graph.disp_min_xv);
            var lowest = my_graph.yv[index];
            var highest = my_graph.yv[index];
            var val;
            for(var i = 0; i < my_graph.w; i++)
            {
              val = my_graph.nextqueryxt(i/my_graph.w,index);
              if(val < lowest)  lowest  = val;
              if(val > highest) highest = val;
            }
            delta = highest-lowest;
            lowest  -= delta*0.1;
            highest += delta*0.1;
            my_graph.disp_min_yv = lowest;
            my_graph.disp_max_yv = highest;
            limitGraph();
          break;
          case 91: //cmd
          case 93: //cmd
            self.cmd = true;
          break;
          case 37: //left
            delta = my_graph.disp_max_xv-my_graph.disp_min_xv;
            my_graph.disp_min_xv -= delta;
            my_graph.disp_max_xv -= delta;
            limitGraph();
          break;
          case 39: //right
            delta = my_graph.disp_max_xv-my_graph.disp_min_xv;
            my_graph.disp_min_xv += delta;
            my_graph.disp_max_xv += delta;
            limitGraph();
          break;
        }
      };
      self.key_up = function(evt)
      {
        switch(evt.keyCode)
        {
          case 16:
            self.shift = false;
          break;
          case 18:
            self.alt = false;
            my_graph.clampDispY();
            my_graph.disp_min_yv = 0;
            my_graph.disp_max_yv *= 1.1;
            limitGraph();
          break;
          case 91: //cmd
          case 93: //cmd
            self.cmd = false;
          break;
        }
      };
    }

    eth_graph = new variable_graph();
    eth_graph.coin = ETH;
    eth_graph.wx = 0;
    eth_graph.wy = -0.05;
    eth_graph.ww = cam.ww-0.1;
    eth_graph.wh = cam.wh-0.2;
    screenSpace(cam,canv,eth_graph);
    eth_graph.genCache();
    eth_graph.total_owned = 0;
    eth_graph.total_spent_val = 0;
    eth_graph.total_owned_val = 0;

    btc_graph = new variable_graph();
    btc_graph.coin = BTC;
    btc_graph.wx = 0;
    btc_graph.wy = -0.05;
    btc_graph.ww = cam.ww-0.1;
    btc_graph.wh = cam.wh-0.2;
    screenSpace(cam,canv,btc_graph);
    btc_graph.genCache();
    btc_graph.total_owned = 0;
    btc_graph.total_spent_val = 0;
    btc_graph.total_owned_val = 0;

    ltc_graph = new variable_graph();
    ltc_graph.coin = LTC;
    ltc_graph.wx = 0;
    ltc_graph.wy = -0.05;
    ltc_graph.ww = cam.ww-0.1;
    ltc_graph.wh = cam.wh-0.2;
    screenSpace(cam,canv,ltc_graph);
    ltc_graph.genCache();
    ltc_graph.total_owned = 0;
    ltc_graph.total_spent_val = 0;
    ltc_graph.total_owned_val = 0;

    my_graph = eth_graph;

    graph_cover =
    {
      x:my_graph.x,
      y:my_graph.y,
      w:my_graph.w,
      h:my_graph.h,
    }

    graph_cover.hover = function(evt)
    {
      var xt = (evt.doX-my_graph.x)/my_graph.w;
      var x = mapVal(0,1,my_graph.disp_min_xv,my_graph.disp_max_xv,xt);
      hover_yval = my_graph.findqueryx(x);
      hover_xval = x;
      hover_pos.x = evt.doX;
      hover_pos.y = evt.doY;
    }
    graph_cover.unhover = function(evt)
    {
      hover_yval = "";
      hover_xval = "";
    }

    graph_cover.dragStart = function(evt)
    {
      var xt = (evt.doX-my_graph.x)/my_graph.w;
      drag_xval = mapVal(0,1,my_graph.disp_min_xv,my_graph.disp_max_xv,xt);
    }
    graph_cover.drag = function(evt)
    {
      var xt = (evt.doX-my_graph.x)/my_graph.w;
      var new_drag_xval = mapVal(0,1,my_graph.disp_min_xv,my_graph.disp_max_xv,xt);
      if(keys.shift)
      {
        var old_xt = mapVal(my_graph.disp_min_xv,my_graph.disp_max_xv,0,1,drag_xval);
        if(xt > 1) return;
        my_graph.disp_min_xv = mapVal(my_graph.disp_max_xv,new_drag_xval,my_graph.disp_max_xv,drag_xval,my_graph.disp_min_xv);
      }
      else
      {
        my_graph.disp_min_xv -= new_drag_xval-drag_xval;
        my_graph.disp_max_xv -= new_drag_xval-drag_xval;
      }
      limitGraph();
    }
    graph_cover.dragFinish = function(evt)
    {

    }

    var x = my_graph.x+140;
    var y = my_graph.y-60;
    var h = 20;
    var w = 50;
    var s = 10;
    eth_btn = new ButtonBox(x,y,w,h,function(){ my_graph = eth_graph; my_graph.dirty = true; });
    x += w+s;
    btc_btn = new ButtonBox(x,y,w,h,function(){ my_graph = btc_graph; my_graph.dirty = true; });
    x += w+s;
    ltc_btn = new ButtonBox(x,y,w,h,function(){ my_graph = ltc_graph; my_graph.dirty = true; });
    x = my_graph.x+140;
    y = my_graph.y-30;
    hr_btn    = new ButtonBox(x,y,w,h,function(){ my_graph.disp_min_xv = my_graph.disp_max_xv-hr; limitGraph(); });
    x += w+s;
    day_btn   = new ButtonBox(x,y,w,h,function(){ my_graph.disp_min_xv = my_graph.disp_max_xv-day; limitGraph(); });
    x += w+s;
    week_btn  = new ButtonBox(x,y,w,h,function(){ my_graph.disp_min_xv = my_graph.disp_max_xv-week; limitGraph(); });
    x += w+s;
    month_btn = new ButtonBox(x,y,w,h,function(){ my_graph.disp_min_xv = my_graph.disp_max_xv-month; limitGraph(); });
    x += w+s*3;
    load_latest_btn = new ButtonBox(x,y,w,h,function()
    {
      if(loading_latest) return;
      loading_latest = true;
      delta = my_graph.disp_max_xv-my_graph.disp_min_xv;
      my_graph.disp_max_xv = my_graph.xv[my_graph.xv.length-1];
      my_graph.disp_min_xv = my_graph.disp_max_xv - delta;
      my_graph.dirty = true;
      getDataBlock(BLOCK_MINUTE,my_graph.coin,my_graph,block_n,function()
      {
        delta = my_graph.disp_max_xv-my_graph.disp_min_xv;
        my_graph.disp_max_xv = my_graph.xv[my_graph.xv.length-1];
        my_graph.disp_min_xv = my_graph.disp_max_xv - delta;
        loading_latest = false;
      });
    });
    x += w+s;
    enhance_btn = new ButtonBox(x,y,w,h,function()
    {
      if(enhancing) return;
      enhancing = true;
      var from = floor(my_graph.disp_min_xv);
      var to   = floor(my_graph.disp_max_xv);
      var n = 100;
      for(var i = 0; i < n; i++)
        getDataPt(floor(lerp(from,to,i/n)),my_graph,noop);
      getDataPt(floor(to),my_graph,function(){enhancing = false;});
    });

    var callback = function(graph)
    {
      graph.clampDisp();
      graph.disp_min_xv = graph.disp_max_xv-day;
      graph.disp_min_yv = 0;
      graph.disp_max_yv *= 1.1;

      if(purchases && purchases[graph.coin])
      {
        graph.total_owned = 0;
        graph.total_spent_val = 0;
        graph.total_owned_val = 0;
        for(var i = 0; i < purchases[graph.coin].length; i++)
        {
          graph.total_owned += purchases[graph.coin][i].amt;
          graph.total_spent_val += purchases[graph.coin][i].amt*graph.findqueryx(purchases[graph.coin][i].ts);
        }
      }
      graph.total_owned_val = graph.yv[graph.yv.length-1]*graph.total_owned;
      limitGraph();
    }
    getDataBlock(BLOCK_MINUTE,ETH,eth_graph,block_n,callback);
    getDataBlock(BLOCK_HOUR,  ETH,eth_graph,block_n,callback);
    getDataBlock(BLOCK_DAY,   ETH,eth_graph,block_n,callback);
    getDataBlock(BLOCK_MINUTE,BTC,btc_graph,block_n,callback);
    getDataBlock(BLOCK_HOUR,  BTC,btc_graph,block_n,callback);
    getDataBlock(BLOCK_DAY,   BTC,btc_graph,block_n,callback);
    getDataBlock(BLOCK_MINUTE,LTC,ltc_graph,block_n,callback);
    getDataBlock(BLOCK_HOUR,  LTC,ltc_graph,block_n,callback);
    getDataBlock(BLOCK_DAY,   LTC,ltc_graph,block_n,callback);

    left_val = 0;
    right_val = 0;
  };

  self.tick = function()
  {
    hoverer.filter(graph_cover);
    hoverer.flush();
    dragger.filter(graph_cover);
    dragger.flush();
    clicker.filter(eth_btn);
    clicker.filter(btc_btn);
    clicker.filter(ltc_btn);
    clicker.filter(hr_btn);
    clicker.filter(day_btn);
    clicker.filter(week_btn);
    clicker.filter(month_btn);
    clicker.filter(load_latest_btn);
    clicker.filter(enhance_btn);
    clicker.flush();
    keyer.filter(keys);
    keyer.flush();
  };

  self.draw = function()
  {
    left_val  = my_graph.findqueryx(my_graph.disp_min_xv);
    right_val = my_graph.findqueryx(my_graph.disp_max_xv);
    var delta = right_val-left_val;
    var p = delta/left_val;
    var arc_r = 5;

    my_graph.draw(ctx);

    //cur price
    ctx.fillStyle = black;
    ctx.textAlign = "right";
      //cur = right side
    if(my_graph.disp_max_xv == my_graph.xv[my_graph.xv.length-1])
    {
      ctx.font = "24px Arial";
      ctx.fillText("$"+fdisp(my_graph.yv[my_graph.yv.length-1]), my_graph.x+my_graph.w, my_graph.y-20);
      load_latest_btn.w = 85;
      load_latest_btn.x = my_graph.x+my_graph.w-load_latest_btn.w;
      load_latest_btn.h = 24;
      load_latest_btn.y = my_graph.y-20-load_latest_btn.h;
    }
      //cur != right side
    else
    {
      ctx.font = "20px Arial";
      ctx.fillText("$"+fdisp(my_graph.yv[my_graph.yv.length-1]), my_graph.x+my_graph.w, my_graph.y-28);
      ctx.font = "12px Arial";
      ctx.fillText("$"+fdisp(right_val), my_graph.x+my_graph.w, my_graph.y-16);
      load_latest_btn.w = 75;
      load_latest_btn.x = my_graph.x+my_graph.w-load_latest_btn.w;
      load_latest_btn.h = 20;
      load_latest_btn.y = my_graph.y-28-load_latest_btn.h;
    }
    ctx.font = "12px Arial";
    ctx.fillText("$"+fdisp(left_val), my_graph.x+my_graph.w-100, my_graph.y-16);
    enhance_btn.w = 40;
    enhance_btn.x = my_graph.x+my_graph.w-90-enhance_btn.w;
    enhance_btn.h = 12;
    enhance_btn.y = my_graph.y-16-enhance_btn.h;

    if(p > 0)
    {
      ctx.fillStyle = green;
      ctx.fillText("+$"+fdisp(delta)+" (+"+fdisp(p*100)+"%)", my_graph.x+my_graph.w-100, my_graph.y-30);
    }
    else
    {
      ctx.fillStyle = red;
      ctx.fillText("-$"+fdisp(delta*-1)+" ("+fdisp(p*100)+"%)", my_graph.x+my_graph.w-100, my_graph.y-30);
    }
    ctx.fillStyle = black;

    //owned price
    if(keys.cmd)
    {
      var s = 20;
      ctx.font = s+"px Arial";
      drawOutlinedText(my_graph.coin+" "+my_graph.total_owned, my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*3, 1, ctx);
      drawOutlinedText("(@ $"+fdisp(my_graph.total_spent_val/my_graph.total_owned)+")", my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*2, 1, ctx);
      var delta = my_graph.total_owned_val-my_graph.total_spent_val;
      var p = delta/my_graph.total_spent_val;
      drawOutlinedText("$"+fdisp(my_graph.total_spent_val)+" -> $"+fdisp(my_graph.total_owned_val), my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*1, 1, ctx);
      if(delta > 0)
      {
        ctx.fillStyle = green;
        drawOutlinedText("+$"+fdisp(delta)+" (+"+fdisp(p*100)+"%)", my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*0, 1, ctx);
      }
      else
      {
        ctx.fillStyle = red;
        drawOutlinedText("-$"+fdisp(delta*-1)+" ("+fdisp(p*100)+"%)", my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*0, 1, ctx);
      }
    }

    //hover
    ctx.textAlign = "left";
    ctx.strokeStyle = black;
    ctx.font = "12px Arial";
    var x;
    var y;
    ctx.strokeStyle = "#004488";
    ctx.lineWidth = 0.5;
    if(hover_xval)
    {
      drawOutlinedText("$"+fdisp(hover_yval), my_graph.x,my_graph.y-30, 1, ctx);
      var date = new Date(floor(hover_xval)*1000);
      drawOutlinedText(dateToString(date),my_graph.x,my_graph.y-15, 1, ctx);
      y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, hover_yval);
      ctx.beginPath();
      ctx.arc(hover_pos.x,y,arc_r,0,twopi);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(my_graph.x           ,y);
      ctx.lineTo(my_graph.x+my_graph.w,y);
      ctx.moveTo(hover_pos.x,my_graph.y);
      ctx.lineTo(hover_pos.x,my_graph.y+my_graph.h);
      ctx.stroke();
    }

    //time (x) delim
    ctx.strokeStyle = black;
    ctx.lineWidth = 0.1;
    ctx.beginPath();
      //hour
    x = mapVal(my_graph.disp_min_xv,my_graph.disp_max_xv,my_graph.x,my_graph.x+my_graph.w,my_graph.disp_max_xv-hr)
    ctx.fillText("hr", x+5, my_graph.y-2);
    ctx.moveTo(x,my_graph.y);
    ctx.lineTo(x,my_graph.y+my_graph.h);
      //day
    x = mapVal(my_graph.disp_min_xv,my_graph.disp_max_xv,my_graph.x,my_graph.x+my_graph.w,my_graph.disp_max_xv-day)
    ctx.fillText("day", x+5, my_graph.y-2);
    ctx.moveTo(x,my_graph.y);
    ctx.lineTo(x,my_graph.y+my_graph.h);
      //week
    x = mapVal(my_graph.disp_min_xv,my_graph.disp_max_xv,my_graph.x,my_graph.x+my_graph.w,my_graph.disp_max_xv-week)
    ctx.fillText("week", x+5, my_graph.y-2);
    ctx.moveTo(x,my_graph.y);
    ctx.lineTo(x,my_graph.y+my_graph.h);
      //month
    x = mapVal(my_graph.disp_min_xv,my_graph.disp_max_xv,my_graph.x,my_graph.x+my_graph.w,my_graph.disp_max_xv-month)
    ctx.fillText("month", x+5, my_graph.y-2);
    ctx.moveTo(x,my_graph.y);
    ctx.lineTo(x,my_graph.y+my_graph.h);
    ctx.stroke();

    //amt (y) delim
    /*
    var i = 0;
    ctx.beginPath();
    while(i < my_graph.disp_max_yv)
    {
      y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, i);
      ctx.fillText("$"+i, my_graph.x+2, y-2);
      ctx.moveTo(my_graph.x           ,y);
      ctx.lineTo(my_graph.x+my_graph.w,y);
      i+=10;
    }
    ctx.stroke();
    */

    //window start/end (y) delim
    ctx.beginPath();
      //start
    y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, left_val);
    ctx.moveTo(my_graph.x           ,y);
    ctx.lineTo(my_graph.x+my_graph.w,y);
      //end
    val = my_graph.findqueryx(my_graph.disp_max_xv);
    y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, right_val);
    ctx.moveTo(my_graph.x           ,y);
    ctx.lineTo(my_graph.x+my_graph.w,y);
    ctx.stroke();

    //purchases
    ctx.strokeStyle = blue;
    ctx.lineWidth = 0.5;
    if(purchases && purchases[my_graph.coin])
    {
      var closest_i = -1;
      var closest_x = 999999999;
      var closest_y = 0;
      var closest_val = 0;

      val = my_graph.total_spent_val/my_graph.total_owned;
      y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, val);
      ctx.strokeStyle = green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(my_graph.x-arc_r*2,y);
      ctx.lineTo(my_graph.x+arc_r*2,y);
      ctx.moveTo(my_graph.x+my_graph.w-arc_r*2,y);
      ctx.lineTo(my_graph.x+my_graph.w+arc_r*2,y);
      ctx.stroke();

      ctx.lineWidth = 0.5;
      for(var i = 0; i < purchases[my_graph.coin].length; i++)
      {
        val = my_graph.findqueryx(purchases[my_graph.coin][i].ts);
        x = mapVal(my_graph.disp_min_xv, my_graph.disp_max_xv, my_graph.x, my_graph.x+my_graph.w, purchases[my_graph.coin][i].ts);
        y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, val);
        if(abs(x-hover_pos.x) < abs(closest_x-hover_pos.x))
        {
          closest_i = i;
          closest_x = x;
          closest_y = y;
          closest_val = val;
        }
        //circle
        ctx.beginPath();
        ctx.arc(x,y,arc_r,0,twopi);
        ctx.stroke();
        //horiz
        ctx.beginPath();
        if(x-arc_r > my_graph.x && x-arc_r < my_graph.x+my_graph.w)
        {
          ctx.moveTo(my_graph.x,y);
          ctx.lineTo(x-arc_r,   y);
        }
        ctx.moveTo(my_graph.x-arc_r,y);
        ctx.lineTo(my_graph.x+arc_r,y);
        if(x+arc_r > my_graph.x && x+arc_r < my_graph.x+my_graph.w)
        {
          ctx.moveTo(my_graph.x+my_graph.w,y);
          ctx.lineTo(x+arc_r,   y);
        }
        ctx.moveTo(my_graph.x+my_graph.w-arc_r,y);
        ctx.lineTo(my_graph.x+my_graph.w+arc_r,y);
        //vert
        ctx.moveTo(x,y+arc_r);
        ctx.lineTo(x,y+arc_r*5);
        ctx.moveTo(x,y-arc_r);
        ctx.lineTo(x,y-arc_r*5);
        ctx.stroke();
      }
      if(hover_xval && closest_i >= 0)
      {
        x = closest_x;
        var xoff = 2;
        if(x > my_graph.x+my_graph.w-100)
        {
          xoff = -2;
          ctx.textAlign = "right";
        }
        y = closest_y;
        val = closest_val;
        i = closest_i;
        ctx.fillStyle = black;
        drawOutlinedText(my_graph.coin+" "+fdisp(purchases[my_graph.coin][i].amt)+" @ $"+fdisp(val), x+xoff,y+30, 1, ctx);
        var spent = purchases[my_graph.coin][i].amt*val;
        var have = purchases[my_graph.coin][i].amt*my_graph.yv[my_graph.yv.length-1];
        var delta = have-spent;
        var p = delta/spent;
        drawOutlinedText("($"+fdisp(spent)+" -> $"+fdisp(have)+")", x+xoff,y+45, 1, ctx);
        if(delta > 0)
        {
          ctx.fillStyle = green;
          drawOutlinedText("+$"+fdisp(delta)+" (+"+fdisp(p*100)+"%)", x+xoff, y+60, 1, ctx);
        }
        else
        {
          ctx.fillStyle = red;
          drawOutlinedText("-$"+fdisp(delta*-1)+" ("+fdisp(p*100)+"%)", x+xoff, y+60, 1, ctx);
        }
        ctx.fillStyle = black;
        ctx.strokeStyle = black;
        drawOutlinedText(dateToString(new Date(purchases[my_graph.coin][i].ts*1000)),x+xoff,y+75, 1, ctx);
        ctx.beginPath();
        ctx.arc(x,y,arc_r,0,twopi);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x,y+arc_r);
        ctx.lineTo(x,y+arc_r*5);
        ctx.moveTo(x,y-arc_r);
        ctx.lineTo(x,y-arc_r*5);
        ctx.stroke();
        ctx.textAlign = "left";
      }
    }

    //buttons
    ctx.fillStyle = black;
    ctx.strokeStyle = black;
    drawbtntitle(eth_btn,ETH);
    drawbtntitle(btc_btn,BTC);
    drawbtntitle(ltc_btn,LTC);
    drawbtntitle(hr_btn,"hr");
    drawbtntitle(day_btn,"day");
    drawbtntitle(week_btn,"week");
    drawbtntitle(month_btn,"month");
    if(loading_latest) drawbtntitle(load_latest_btn,"");
    if(enhancing)      drawbtntitle(enhance_btn,"");
  };
  var drawbtntitle = function(btn,title)
  {
    ctx.strokeRect(btn.x,btn.y,btn.w,btn.h);
    ctx.fillText(title,btn.x+2,btn.y+btn.h-2);
  }

  self.cleanup = function()
  {
  };

};

