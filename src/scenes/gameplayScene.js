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

  var appname = "ethview";
  var my_graph;

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

  var total_owned_eth;
  var total_spent_val;
  var total_owned_val;

  var left_val;
  var right_val;

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

    hover_pos = {x:0,y:0};

    if(purchases)
    {
      for(var i = 0; i < purchases.length; i++)
      {
        purchases[i].ts = new Date(purchases[i].date);
        purchases[i].ts = floor(purchases[i].ts/1000)+2*hr;
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
      hover_pos.x = evt.doX;
      hover_pos.y = evt.doY;
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
          total_owned_eth += purchases[i].amt;
          total_spent_val += purchases[i].amt*my_graph.findqueryx(purchases[i].ts);
        }
      }
      total_owned_val = my_graph.yv[my_graph.yv.length-1]*total_owned_eth;;
      limitGraph();
    }
    getDataBlock(BLOCK_MINUTE,block_n,callback);
    getDataBlock(BLOCK_HOUR,block_n,callback);
    getDataBlock(BLOCK_DAY,block_n,callback);

    total_owned_eth = 0;
    total_spent_val = 0;
    total_owned_val = 0;
    left_val = 0;
    right_val = 0;
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
      ctx.textAlign = "right";
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
    ctx.fillText("$"+fdisp(left_val), my_graph.x+my_graph.w-90, my_graph.y-16);
    enhance_btn.w = 40;
    enhance_btn.x = my_graph.x+my_graph.w-90-enhance_btn.w;
    enhance_btn.h = 12;
    enhance_btn.y = my_graph.y-16-enhance_btn.h;

    if(p > 0)
    {
      ctx.fillStyle = green;
      ctx.fillText("+$"+fdisp(delta)+" (+"+fdisp(p*100)+"%)", my_graph.x+my_graph.w-90, my_graph.y-30);
    }
    else
    {
      ctx.fillStyle = red;
      ctx.fillText("-$"+fdisp(delta*-1)+" ("+fdisp(p*100)+"%)", my_graph.x+my_graph.w-90, my_graph.y-30);
    }
    ctx.fillStyle = black;

    //owned price
    if(keys.cmd)
    {
      var s = 20;
      ctx.font = s+"px Arial";
      drawOutlinedText("ETH "+total_owned_eth, my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*2, 1, ctx);
      var delta = total_owned_val-total_spent_val;
      var p = delta/total_spent_val;
      drawOutlinedText("$"+fdisp(total_spent_val)+" -> $"+fdisp(total_owned_val), my_graph.x+my_graph.w-10, my_graph.y+my_graph.h-10-s*1, 1, ctx);
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
    if(purchases)
    {
      var closest_i = 0;
      var closest_x = 999999999;
      var closest_y = 0;
      var closest_val = 0;
      for(var i = 0; i < purchases.length; i++)
      {
        val = my_graph.findqueryx(purchases[i].ts);
        x = mapVal(my_graph.disp_min_xv, my_graph.disp_max_xv, my_graph.x, my_graph.x+my_graph.w, purchases[i].ts);
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
      if(hover_xval)
      {
        x = closest_x;
        y = closest_y;
        val = closest_val;
        i = closest_i;
        ctx.fillStyle = black;
        drawOutlinedText("ETH "+fdisp(purchases[i].amt)+" @ $"+fdisp(val), x+2,y+30, 1, ctx);
        var spent = purchases[i].amt*val;
        var have = purchases[i].amt*my_graph.yv[my_graph.yv.length-1];
        var delta = have-spent;
        var p = delta/spent;
        drawOutlinedText("($"+fdisp(spent)+" -> $"+fdisp(have)+")", x+2,y+45, 1, ctx);
        if(delta > 0)
        {
          ctx.fillStyle = green;
          drawOutlinedText("+$"+fdisp(delta)+" (+"+fdisp(p*100)+"%)", x+2, y+60, 1, ctx);
        }
        else
        {
          ctx.fillStyle = red;
          drawOutlinedText("-$"+fdisp(delta*-1)+" ("+fdisp(p*100)+"%)", x+2, y+60, 1, ctx);
        }
        ctx.fillStyle = black;
        ctx.strokeStyle = black;
        drawOutlinedText(dateToString(new Date(purchases[i].ts*1000)),x+2,y+75, 1, ctx);
        ctx.beginPath();
        ctx.arc(x,y,arc_r,0,twopi);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x,y+arc_r);
        ctx.lineTo(x,y+arc_r*5);
        ctx.moveTo(x,y-arc_r);
        ctx.lineTo(x,y-arc_r*5);
        ctx.stroke();
      }
    }

    //buttons
    ctx.fillStyle = black;
    ctx.strokeStyle = black;
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

