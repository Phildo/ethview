var GamePlayScene = function(game, stage)
{
  var self = this;

  var canv = stage.drawCanv;
  var canvas = canv.canvas;
  var ctx = canv.context;
  var cam = {wx:0,wy:0,ww:canv.width/canv.height,wh:1};

  var appname = "ethview";
  var my_graph;
  var total_owned_eth;
  var total_spent_val;
  var total_owned_val;

  var hoverer;
  var dragger;
  var clicker;
  var keyer;

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
  var drag_pos;

  var sec = 1;
  var min = sec*60;
  var hr  = min*60;
  var day = hr*24;
  var week = day*7;
  var month = day*30;
  var year = day*365;

  var block_n = 2000;
  var loading_latest = false;
  var enhancing = false;

  var limitGraph = function()
  {
    if(my_graph.disp_max_xv > my_graph.xv[my_graph.xv.length-1])
    {
      my_graph.disp_min_xv -= my_graph.disp_max_xv-my_graph.xv[my_graph.xv.length-1];
      my_graph.disp_max_xv = my_graph.xv[my_graph.xv.length-1];
    }
    if(my_graph.disp_min_xv > my_graph.disp_max_xv-hr)   my_graph.disp_min_xv = my_graph.disp_max_xv-hr;
    if(my_graph.disp_min_xv < my_graph.disp_max_xv-year) my_graph.disp_min_xv = my_graph.disp_max_xv-year;
    my_graph.dirty = true;
  }

  var getDataPt = function(ts,callback)
  {
    var from = "ETH";
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
            my_graph.insertDataNext(ts,r[from][to],0);
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
  var getDataBlock = function(block,n,callback)
  {
    var span = "day";
    switch(block)
    {
      case BLOCK_DAY:    span = "day";    break;
      case BLOCK_MINUTE: span = "minute"; break;
      case BLOCK_HOUR:   span = "hour";   break;
    }

    var from = "ETH";
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
            my_graph.insertDataBlockNext(x,y,0);
            callback();
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

    keys = new function()
    {
      var self = this;
      self.shift = false;
      self.alt = false;
      self.cmd = false;
      self.key_down = function(evt)
      {
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
            self.cmd = false;
          break;
        }
      };
    }

    my_graph = new variable_graph();
    my_graph.wx = 0;
    my_graph.wy = -0.05;
    my_graph.ww = cam.ww-0.1;
    my_graph.wh = cam.wh-0.2;
    screenSpace(cam,canv,my_graph);
    my_graph.genCache();

    my_graph.hover = function(evt)
    {
      var xt = (evt.doX-my_graph.x)/my_graph.w;
      var x = mapVal(0,1,my_graph.disp_min_xv,my_graph.disp_max_xv,xt);
      hover_yval = my_graph.findqueryx(x);
      hover_xval = x;
      hover_pos = {x:evt.doX,y:evt.doY};
    }
    my_graph.unhover = function(evt)
    {
      hover_yval = "";
      hover_xval = "";
    }

    my_graph.dragStart = function(evt)
    {
      var xt = (evt.doX-my_graph.x)/my_graph.w;
      drag_xval = mapVal(0,1,my_graph.disp_min_xv,my_graph.disp_max_xv,xt);
    }
    my_graph.drag = function(evt)
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
    my_graph.dragFinish = function(evt)
    {

    }

    total_owned_eth = 0;
    total_spent_val = 0;
    total_owned_val = 0;

    var x = my_graph.x+140;
    var y = my_graph.y-30;
    var h = 20;
    var w = 50;
    var s = 10;
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
      getDataBlock(BLOCK_MINUTE,block_n,function()
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
        getDataPt(floor(lerp(from,to,i/n)),noop);
      getDataPt(floor(to),function(){enhancing = false;});
    });

    var callback = function()
    {
      my_graph.clampDisp();
      my_graph.disp_min_xv = my_graph.disp_max_xv-day;
      my_graph.disp_min_yv = 0;
      my_graph.disp_max_yv *= 1.1;

      if(purchases)
      {
        total_owned_eth = 0;
        total_spent_val = 0;
        total_owned_val = 0;
        for(var i = 0; i < purchases.length; i++)
        {
          var date = new Date(purchases[i].date);
          var ts = floor(date)/1000;
          val = my_graph.findqueryx(ts);
          total_owned_eth += purchases[i].amt;
          total_spent_val += purchases[i].amt*val;
        }
      }
      total_owned_val = my_graph.yv[my_graph.yv.length-1]*total_owned_eth;;
      limitGraph();
    }
    getDataBlock(BLOCK_MINUTE,block_n,callback);
    getDataBlock(BLOCK_HOUR,block_n,callback);
    getDataBlock(BLOCK_DAY,block_n,callback);
  };

  self.tick = function()
  {
    hoverer.filter(my_graph);
    hoverer.flush();
    dragger.filter(my_graph);
    dragger.flush();
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
    //cur price
    ctx.textAlign = "right";
    ctx.font = "20px Arial";
    ctx.fillText("$"+fdisp(my_graph.yv[my_graph.yv.length-1]), my_graph.x+my_graph.w, my_graph.y-20);

    //owned price
    if(keys.cmd)
    {
      var s = 20;
      ctx.font = s+"px Arial";
      ctx.fillText("ETH "+total_owned_eth, my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*3);
      ctx.fillText("Spent $"+fdisp(total_spent_val), my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*2);
      ctx.fillText("Have  $"+fdisp(total_owned_val), my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*1);
      ctx.fillText("delta $"+fdisp(total_owned_val-total_spent_val), my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*0);
    }

    //hover
    ctx.textAlign = "left";
    ctx.font = "12px Arial";
    var x;
    var y;
    ctx.strokeStyle = "#004488";
    ctx.lineWidth = 0.5;
    if(hover_xval)
    {
      ctx.fillText("$"+fdisp(hover_yval), my_graph.x,my_graph.y-30);
      var date = new Date(floor(hover_xval)*1000);
      ctx.fillText(dateToString(date),my_graph.x,my_graph.y-15);
      y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, hover_yval);
      ctx.beginPath();
      ctx.arc(hover_pos.x,y,5,0,twopi);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(my_graph.x           ,y);
      ctx.lineTo(my_graph.x+my_graph.w,y);
      ctx.moveTo(hover_pos.x,my_graph.y);
      ctx.lineTo(hover_pos.x,my_graph.y+my_graph.h);
      ctx.stroke();
    }

    //time (x) delim
    ctx.strokeStyle = "#000000";
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
    val = my_graph.findqueryx(my_graph.disp_min_xv);
    y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, val);
    ctx.fillText("$"+fdisp(val), my_graph.x+20, y-2);
    ctx.moveTo(my_graph.x           ,y);
    ctx.lineTo(my_graph.x+my_graph.w,y);
      //end
    val = my_graph.findqueryx(my_graph.disp_max_xv);
    y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, val);
    ctx.fillText("$"+fdisp(val), my_graph.x+my_graph.w-100, y-2);
    ctx.moveTo(my_graph.x           ,y);
    ctx.lineTo(my_graph.x+my_graph.w,y);
    ctx.stroke();

    //purchases
    ctx.strokeStyle = "#008844";
    ctx.lineWidth = 0.5;
    if(purchases)
    {
      for(var i = 0; i < purchases.length; i++)
      {
        var date = new Date(purchases[i].date);
        var ts = floor(date)/1000;
        val = my_graph.findqueryx(ts);
        x = mapVal(my_graph.disp_min_xv, my_graph.disp_max_xv, my_graph.x, my_graph.x+my_graph.w, ts);
        y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, val);
        ctx.fillText("$"+fdisp(val), x+2,y-30);
        ctx.fillText(dateToString(date),x+2,y-15);
        ctx.beginPath();
        ctx.arc(x,y,5,0,twopi);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(my_graph.x           ,y);
        ctx.lineTo(my_graph.x+my_graph.w,y);
        ctx.moveTo(x,my_graph.y);
        ctx.lineTo(x,my_graph.y+my_graph.h);
        ctx.stroke();
      }
    }

    //buttons
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    drawbtntitle(hr_btn,"hr");
    drawbtntitle(day_btn,"day");
    drawbtntitle(week_btn,"week");
    drawbtntitle(month_btn,"month");
    if(!loading_latest) drawbtntitle(load_latest_btn,"latest");
    if(!enhancing)      drawbtntitle(enhance_btn,"enhance");

    my_graph.draw(ctx);
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

