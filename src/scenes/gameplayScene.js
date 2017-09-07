var GamePlayScene = function(game, stage)
{
  var self = this;

  var ENUM = 0;

  var canv = stage.drawCanv;
  var canvas = canv.canvas;
  var ctx = canv.context;
  var cam = {wx:0,wy:0,ww:canv.width/canv.height,wh:1};

  var hoverer;
  var dragger;
  var clicker;
  var keyer;

  var req_q;
  var req_t;

  var sec = 1*1000;
  var min = sec*60;
  var hr  = min*60;
  var day = hr*24;
  var week = day*7;
  var month = day*30;
  var year = day*365;

  var red = "#AA0000";
  var green = "#00AA00";
  var blue = "#004488";
  var black = "#000000";
  var white = "#FFFFFF";
  var lr_grad;
  var rl_grad;

  var appname = "coinview";
  var HR = "HR";
  var DAY = "DAY";
  var WEEK = "WEEK";
  var MONTH = "MONTH";

  ENUM = 0;
  var COIN_ETH = ENUM; ENUM++;
  var COIN_BTC = ENUM; ENUM++;
  var COIN_LTC = ENUM; ENUM++;
  var COIN_COUNT = ENUM; ENUM++;

  ENUM = 0;
  var BLOCK_MINUTE = ENUM; ENUM++;
  var BLOCK_HOUR   = ENUM; ENUM++;
  var BLOCK_DAY    = ENUM; ENUM++;
  var BLOCK_COUNT  = ENUM; ENUM++;

  ENUM = 0;
  var SRC_KRAK  = ENUM; ENUM++;
  var SRC_GDAX  = ENUM; ENUM++;
  var SRC_COUNT = ENUM; ENUM++;

  var graphs = [];
  var my_graph;
  var graph_cover;

  var eth_btn;
  var btc_btn;
  var ltc_btn;
  var hr_btn;
  var day_btn;
  var week_btn;
  var month_btn;
  var cmd_btn;
  var alt_btn;
  var show_btn;
  var auto_btn;
  var left_btn;
  var right_btn;
  var load_latest_btn;
  var enhance_btn;

  var keys;
  var show_purchases = false;
  var auto_purchases = false;
  var auto_max_countdown = 30*60;
  var auto_countdown = auto_max_countdown;

  var hover_xval;
  var hover_yval;
  var hover_pos;
  var drag_xval;

  var block_n = 2000;
  var loading_latest = false;
  var enhancing = false;

  var left_val;
  var right_val;
  var span_delta;
  var span_delta_p;

  var target_disp_min_xv;
  var target_disp_max_xv;
  var target_disp_min_yv = [];
  var target_disp_max_yv = [];
  var target_disp_ttl;
  var target_disp_max_ttl;

  var ticker = function(coin)
  {
    switch(coin)
    {
      case COIN_ETH: return "ETH"; break;
      case COIN_BTC: return "BTC"; break;
      case COIN_LTC: return "LTC"; break;
    }
    return "ETH";
  }

  var alignGraphs = function()
  {
    for(var i = 0; i < SRC_COUNT; i++)
    {
      for(var j = 0; j < COIN_COUNT; j++)
      {
        graphs[i][j].disp_min_xv = my_graph.disp_min_xv;
        graphs[i][j].disp_max_xv = my_graph.disp_max_xv;
        graphs[i][j].span = my_graph.span;
        graphs[i][j].disp_min_yv = graphs[0][j].disp_min_yv;
        graphs[i][j].disp_max_yv = graphs[0][j].disp_max_yv;
      }
    }
    eth_pressure_graph.disp_min_xv = my_graph.disp_min_xv;
    eth_pressure_graph.disp_max_xv = my_graph.disp_max_xv;
    eth_pressure_graph.span = my_graph.span;
  }

  var aggregatePurchases = function(graph)
  {
    graph.total_owned = 0;
    graph.total_spent_val = 0;
    graph.total_owned_val = 0;
    var tick = ticker(graph.coin);
    if(purchases && purchases[tick])
    {
      for(var i = 0; i < purchases[tick].length; i++)
      {
        graph.total_owned += purchases[tick][i].amt;
        graph.total_spent_val += purchases[tick][i].spent;
      }
    }
    graph.total_owned_val = graph.yv[graph.yv.length-1]*graph.total_owned;
  }

  var targetSelf = function()
  {
    target_disp_min_xv = my_graph.disp_min_xv;
    target_disp_max_xv = my_graph.disp_max_xv;
    for(var i = 0; i < COIN_COUNT; i++)
    {
      target_disp_min_yv[i] = graphs[0][i].disp_min_yv;
      target_disp_max_yv[i] = graphs[0][i].disp_max_yv;
    }
  }

  var limitGraph = function()
  {
    if(my_graph.disp_max_xv > my_graph.xv[my_graph.xv.length-1])
    {
      my_graph.disp_min_xv -= my_graph.disp_max_xv-my_graph.xv[my_graph.xv.length-1];
      my_graph.disp_max_xv = my_graph.xv[my_graph.xv.length-1];
      target_disp_min_xv = my_graph.disp_min_xv;
      target_disp_max_xv = my_graph.disp_max_xv;
    }
    if(my_graph.disp_min_xv > my_graph.disp_max_xv-hr)   { my_graph.disp_min_xv = my_graph.disp_max_xv-hr;   target_disp_min_xv = my_graph.disp_min_xv; }
    if(my_graph.disp_min_xv < my_graph.disp_max_xv-year) { my_graph.disp_min_xv = my_graph.disp_max_xv-year; target_disp_min_xv = my_graph.disp_min_xv; }

    if(target_disp_max_xv > my_graph.xv[my_graph.xv.length-1])
    {
      target_disp_min_xv = my_graph.xv[my_graph.xv.length-1]-(my_graph.disp_max_xv-my_graph.disp_min_xv);
      target_disp_max_xv = my_graph.xv[my_graph.xv.length-1];
    }
    if(target_disp_min_xv > target_disp_max_xv-hr)   target_disp_min_xv = target_disp_max_xv-hr;
    if(target_disp_min_xv < target_disp_max_xv-year) target_disp_min_xv = target_disp_max_xv-year;

    alignGraphs();
    my_graph.dirty = true;
  }

  var stretchGraph = function()
  {
    for(var i = 0; i < COIN_COUNT; i++)
    {
      var index = graphs[0][i].findibeforex(graphs[0][i].disp_min_xv);
      var lowest = graphs[0][i].yv[index];
      var highest = graphs[0][i].yv[index];
      var val;
      for(var j = 0; j <= graphs[0][i].w; j++)
      {
        val = graphs[0][i].nextqueryxt(j/graphs[0][i].w,index);
        if(val < lowest)  lowest  = val;
        if(val > highest) highest = val;
      }
      delta = highest-lowest;
      lowest  -= delta*0.1;
      highest += delta*0.1;
      target_disp_min_yv[i] = lowest;
      target_disp_max_yv[i] = highest;
      target_disp_ttl = target_disp_max_ttl;
    }
    limitGraph();
  }

  var normalizeGraph = function()
  {
    for(var i = 0; i < COIN_COUNT; i++)
    {
      if(graphs[0][i].known_min_yv == graphs[0][i].known_max_yv)
      {
        target_disp_min_yv[i] = graphs[0][i].known_min_yv-1;
        target_disp_max_yv[i] = graphs[0][i].known_max_yv+1;
      }
      else
      {
        target_disp_min_yv[i] = graphs[0][i].known_min_yv;
        target_disp_max_yv[i] = graphs[0][i].known_max_yv;
      }
      target_disp_min_yv[i] = 0;
      target_disp_max_yv[i] *= 1.1;
      target_disp_ttl = target_disp_max_ttl;
    }
    limitGraph();
  }

  var getDataPt = function(ts,graph,callback)
  {
    var from = ticker(graph.coin);
    var to = "USD";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = (function a(xhr){return function()
    {
      if(xhr.readyState == 4)
      {
        if(xhr.status == 200)
        {
          var r = JSON.parse(xhr.responseText);
          if(r && r[from] && r[from][to])
          {
            graph.insertDataNext(ts,r[from][to],0,3);
            callback();
          }
        }
      }
    }})(xhr);
    xhr.open("GET","https://min-api.cryptocompare.com/data/pricehistorical?fsym="+from+"&tsyms="+to+"&ts="+ts+"&extraParams="+appname,true);
    req_q.push(xhr);
  }

  var getDataBlock = function(block,src,coin,graph,n,callback)
  {
    if(src == SRC_KRAK)
    {
      var span = "day";
      var priority = 3;
      switch(block)
      {
        case BLOCK_DAY:    span = "day";    priority = 2; break;
        case BLOCK_HOUR:   span = "hour";   priority = 1; break;
        case BLOCK_MINUTE: span = "minute"; priority = 0; break;
      }

      var from = ticker(coin);
      var to = "USD";
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = (function a(xhr){return function()
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
                x[i] = r.Data[i].time*1000;
                y[i] = r.Data[i].close;
              }
              graph.insertDataBlockNext(x,y,0,priority);
              callback(graph);
            }
          }
        }
      }})(xhr);
      xhr.open("GET","https://min-api.cryptocompare.com/data/histo"+span+"?fsym="+from+"&tsym="+to+"&limit="+n+"&aggregate=1&extraParams="+appname,true);
      req_q.push(xhr);
    }
    else if(src == SRC_GDAX)
    {
      var start;
      var end = new Date();
      var inc = day;
      var priority = 3;
      switch(block)
      {
        case BLOCK_DAY:    inc = day;  priority = 2; break;
        case BLOCK_HOUR:   inc = hr;   priority = 1; break;
        case BLOCK_MINUTE: inc = min;  priority = 0; break;
      }
      if(inc != hr && inc != min) return;
      start = end-inc*n;

      var from = ticker(coin);
      var wait = 1;
      while(start < end)
      {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = (function a(xhr){return function()
        {
          if(xhr.readyState == 4)
          {
            if(xhr.status == 200)
            {
              var r = JSON.parse(xhr.responseText);

              if(r && r.length)
              {
                var x = [];
                var y = [];
                for(var i = 0; i < r.length; i++)
                {
                  x[i] = floor(new Date(r[i][0]))*1000;
                  y[i] = (parseFloat(r[i][1])+parseFloat(r[i][2]))/2;
                }
                graph.insertDataBlockNext(x,y,0,priority);
                callback(graph);
              }
            }
          }
        }})(xhr);
        if(start+inc*200 < end) xhr.open("GET","https://api.gdax.com/products/"+from+"-USD/candles?start="+new Date(start).toISOString()+"&end="+new Date(start+inc*200).toISOString()+"&granularity="+(inc/1000),true);
        else                    xhr.open("GET","https://api.gdax.com/products/"+from+"-USD/candles?start="+new Date(start).toISOString()+"&end="+end.toISOString()+"&granularity="+(inc/1000),true);
        req_q.push(xhr);
        start += inc*200;
        wait++;
      }
    }
  }

  var getPressureDataBlock = function(page,coin,graph,callback)
  {
    var from = ticker(coin);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = (function a(xhr){return function()
    {
      if(xhr.readyState == 4)
      {
        if(xhr.status == 200)
        {
          var r = JSON.parse(xhr.responseText);

          if(r && r.length)
          {
            var x = [];
            var y = [];
            for(var i = 0; i < r.length; i++)
            {
              x[i] = floor(new Date(r[i].time));
              y[i] = parseFloat(r[i].size);
              if(r[i].side == "buy") y[i] *= -1;
            }
            graph.insertDataBlockNext(x,y,0,1);
            callback(graph);
          }
        }
      }
    }})(xhr);

    xhr.open("GET","https://api.gdax.com/products/"+from+"-USD/trades?before="+page+"&limit=100",true);
    req_q.push(xhr);
  }

  self.ready = function()
  {
    hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});
    clicker = new Clicker({source:stage.dispCanv.canvas});
    keyer = new Keyer({source:stage.dispCanv.canvas});

    req_q = [];
    req_t = 0;

    hover_pos = {x:0,y:0};

    left_val = 0;
    right_val = 0;
    span_delta = 0;
    span_delta_p = 0;

    target_disp_min_xv = 0;
    target_disp_max_xv = 0;
    for(var i = 0; i < COIN_COUNT; i++)
    {
      target_disp_min_yv[i] = 0;
      target_disp_max_yv[i] = 0;
    }
    target_disp_ttl = 0;
    target_disp_max_ttl = 20;

    if(purchases)
    {
      if(purchases.ETH)
      {
        for(var i = 0; i < purchases.ETH.length; i++)
        {
          purchases.ETH[i].ts = new Date(purchases.ETH[i].date);
          purchases.ETH[i].ts = floor(purchases.ETH[i].ts)+2*hr;
          purchases.ETH[i].rate = purchases.ETH[i].spent/purchases.ETH[i].amt;
        }
        for(var i = 0; i < purchases.ETH.length-1; i++)
        {
          if(abs(purchases.ETH[i].ts-purchases.ETH[i+1].ts) < 10*min)
          {
            purchases.ETH[i].amt += purchases.ETH[i+1].amt;
            purchases.ETH[i].spent += purchases.ETH[i+1].spent;
            purchases.ETH[i].rate = purchases.ETH[i].spent/purchases.ETH[i].amt;
            purchases.ETH.splice(i+1,1);
            i--
          }
        }
      }
      if(purchases.BTC)
      {
        for(var i = 0; i < purchases.BTC.length; i++)
        {
          purchases.BTC[i].ts = new Date(purchases.BTC[i].date);
          purchases.BTC[i].ts = floor(purchases.BTC[i].ts)+2*hr;
          purchases.BTC[i].rate = purchases.BTC[i].spent/purchases.BTC[i].amt;
        }
        for(var i = 0; i < purchases.BTC.length-1; i++)
        {
          if(abs(purchases.BTC[i].ts-purchases.BTC[i+1].ts) < 10*min)
          {
            purchases.BTC[i].amt += purchases.BTC[i+1].amt;
            purchases.BTC[i].spent += purchases.BTC[i+1].spent;
            purchases.BTC[i].rate = purchases.BTC[i].spent/purchases.BTC[i].amt;
            purchases.BTC.splice(i+1,1);
            i--
          }
        }
      }
      if(purchases.LTC)
      {
        for(var i = 0; i < purchases.LTC.length; i++)
        {
          purchases.LTC[i].ts = new Date(purchases.LTC[i].date);
          purchases.LTC[i].ts = floor(purchases.LTC[i].ts)+2*hr;
          purchases.LTC[i].rate = purchases.LTC[i].spent/purchases.LTC[i].amt;
        }
        for(var i = 0; i < purchases.LTC.length-1; i++)
        {
          if(abs(purchases.LTC[i].ts-purchases.LTC[i+1].ts) < 10*min)
          {
            purchases.LTC[i].amt += purchases.LTC[i+1].amt;
            purchases.LTC[i].spent += purchases.LTC[i+1].spent;
            purchases.LTC[i].rate = purchases.LTC[i].spent/purchases.LTC[i].amt;
            purchases.LTC.splice(i+1,1);
            i--
          }
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
        var delta;
        switch(evt.keyCode)
        {
          case 16: //shift
            self.shift = true;
          break;
          case 18: //alt
            self.alt = true;
            stretchGraph();
          break;
          case 91: //cmd
          case 93: //cmd
            self.cmd = true;
          break;
          case 37: //left
            delta = my_graph.disp_max_xv-my_graph.disp_min_xv;
            target_disp_min_xv -= delta;
            target_disp_max_xv -= delta;
            if(target_disp_min_xv < my_graph.xv[0])
            {
              delta = my_graph.xv[0] - target_disp_min_xv;
              target_disp_min_xv += delta;
              target_disp_max_xv += delta;
            }
            target_disp_ttl = target_disp_max_ttl;
            limitGraph();
          break;
          case 39: //right
            delta = my_graph.disp_max_xv-my_graph.disp_min_xv;
            target_disp_min_xv += delta;
            target_disp_max_xv += delta;
            if(target_disp_max_xv > my_graph.xv[my_graph.xv.length-1])
            {
              delta = target_disp_max_xv - my_graph.xv[my_graph.xv.length-1];
              target_disp_min_xv -= delta;
              target_disp_max_xv -= delta;
            }
            target_disp_ttl = target_disp_max_ttl;
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
            normalizeGraph();
          break;
          case 91: //cmd
          case 93: //cmd
            self.cmd = false;
          break;
        }
      };
    }

    for(var i = 0; i < SRC_COUNT; i++)
      graphs[i] = [];

    graphs[SRC_KRAK][COIN_ETH] = new variable_graph();
    graphs[SRC_KRAK][COIN_ETH].coin = COIN_ETH;
    graphs[SRC_KRAK][COIN_ETH].wx = 0;
    graphs[SRC_KRAK][COIN_ETH].wy = -0.10;
    graphs[SRC_KRAK][COIN_ETH].ww = cam.ww-0.1;
    graphs[SRC_KRAK][COIN_ETH].wh = cam.wh-0.3;
    screenSpace(cam,canv,graphs[SRC_KRAK][COIN_ETH]);
    graphs[SRC_KRAK][COIN_ETH].genCache();
    graphs[SRC_KRAK][COIN_ETH].total_owned = 0;
    graphs[SRC_KRAK][COIN_ETH].total_spent_val = 0;
    graphs[SRC_KRAK][COIN_ETH].total_owned_val = 0;

    for(var i = 0; i < SRC_COUNT; i++)
    {
      for(var j = 0; j < COIN_COUNT; j++)
      {
        if(i == 0 && j == 0) continue; //already done
        graphs[i][j] = new variable_graph();
        graphs[i][j].coin = j;
        graphs[i][j].wx = graphs[SRC_KRAK][COIN_ETH].wx;
        graphs[i][j].wy = graphs[SRC_KRAK][COIN_ETH].wy;
        graphs[i][j].ww = graphs[SRC_KRAK][COIN_ETH].ww;
        graphs[i][j].wh = graphs[SRC_KRAK][COIN_ETH].wh;
        screenSpace(cam,canv,graphs[i][j]);
        graphs[i][j].genCache();
        graphs[i][j].total_owned = 0;
        graphs[i][j].total_spent_val = 0;
        graphs[i][j].total_owned_val = 0;
      }
    }

    graphs[SRC_KRAK][COIN_ETH].color = "#3D95FD";
    graphs[SRC_GDAX][COIN_ETH].color = "#004488";
    graphs[SRC_KRAK][COIN_BTC].color = "#FAB915";
    graphs[SRC_GDAX][COIN_BTC].color = "#F5A400";
    graphs[SRC_KRAK][COIN_LTC].color = "#494949";
    graphs[SRC_GDAX][COIN_LTC].color = "#5F5F5F";

    eth_pressure_graph = new running_deriv_variable_graph();
    eth_pressure_graph.coin = COIN_ETH;
    eth_pressure_graph.wx = 0;
    eth_pressure_graph.wy = -0.10;
    eth_pressure_graph.ww = cam.ww-0.1;
    eth_pressure_graph.wh = cam.wh-0.3;
    screenSpace(cam,canv,eth_pressure_graph);
    eth_pressure_graph.genCache();

    my_graph = graphs[SRC_KRAK][COIN_ETH];

    lr_grad= ctx.createLinearGradient(my_graph.x, 0, my_graph.x+my_graph.w, 0);
    lr_grad.addColorStop(0, "black");
    lr_grad.addColorStop(1, "white");
    rl_grad= ctx.createLinearGradient(my_graph.x, 0, my_graph.x+my_graph.w, 0);
    rl_grad.addColorStop(0, "white");
    rl_grad.addColorStop(1, "black");

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
        target_disp_min_xv = my_graph.disp_min_xv;
        my_graph.span = "";
      }
      else
      {
        my_graph.disp_min_xv -= new_drag_xval-drag_xval;
        my_graph.disp_max_xv -= new_drag_xval-drag_xval;
        target_disp_min_xv = my_graph.disp_min_xv;
        target_disp_max_xv = my_graph.disp_max_xv;
      }
      limitGraph();
    }
    graph_cover.dragFinish = function(evt)
    {

    }

    var x = my_graph.x+140;
    var h = 40;
    var w = 50;
    var s = 10;
    var y = my_graph.y-(s+h)*2;
    eth_btn = new ButtonBox(x,y,w,h,function(){ my_graph = graphs[SRC_KRAK][COIN_ETH]; if(keys.alt) stretchGraph(); else normalizeGraph(); my_graph.dirty = true; });
    x += w+s;
    btc_btn = new ButtonBox(x,y,w,h,function(){ my_graph = graphs[SRC_KRAK][COIN_BTC]; if(keys.alt) stretchGraph(); else normalizeGraph(); my_graph.dirty = true; });
    x += w+s;
    ltc_btn = new ButtonBox(x,y,w,h,function(){ my_graph = graphs[SRC_KRAK][COIN_LTC]; if(keys.alt) stretchGraph(); else normalizeGraph(); my_graph.dirty = true; });
    x += w+s;
    show_btn = new ButtonBox(x,y,w,h,function(){ show_purchases = !show_purchases; });
    x += w+s*3;
    x = my_graph.x+140;
    y = my_graph.y-(s+h);
    hr_btn    = new ButtonBox(x,y,w,h,function(){ target_disp_min_xv = my_graph.disp_max_xv-hr; target_disp_ttl = target_disp_max_ttl; my_graph.span = HR; limitGraph(); });
    x += w+s;
    day_btn   = new ButtonBox(x,y,w,h,function(){ target_disp_min_xv = my_graph.disp_max_xv-day; target_disp_ttl = target_disp_max_ttl; my_graph.span = DAY; limitGraph(); });
    x += w+s;
    week_btn  = new ButtonBox(x,y,w,h,function(){ target_disp_min_xv = my_graph.disp_max_xv-week; target_disp_ttl = target_disp_max_ttl; my_graph.span = WEEK; limitGraph(); });
    x += w+s;
    month_btn = new ButtonBox(x,y,w,h,function(){ target_disp_min_xv = my_graph.disp_max_xv-month; target_disp_ttl = target_disp_max_ttl; my_graph.span = MONTH; limitGraph(); });
    x += w+s*3;
    x = my_graph.x;
    y = my_graph.y-(s+h)*2;
    cmd_btn  = new ButtonBox(x,y,w,h,function(){ keys.cmd = !keys.cmd; });
    x += w+s;
    alt_btn = new ButtonBox(x,y,w,h,function(){ keys.alt = !keys.alt; if(keys.alt) stretchGraph(); else normalizeGraph(); });
    x += w+s*3;
    x = my_graph.x+my_graph.w-(w+(s+w)*2);
    auto_btn = new ButtonBox(x,y,w,h,function(){ auto_purchases = !auto_purchases; });
    x += w+s;
    left_btn  = new ButtonBox(x,y,w,h,function(){ keys.key_down({keyCode:37}); });
    x += w+s;
    right_btn = new ButtonBox(x,y,w,h,function(){ keys.key_down({keyCode:39}); });
    x += w+s*3;
    load_latest_btn = new ButtonBox(x,y,w,h,function()
    {
      if(loading_latest) return;
      loading_latest = true;
      delta = my_graph.disp_max_xv-my_graph.disp_min_xv;
      target_disp_max_xv = my_graph.xv[my_graph.xv.length-1];
      target_disp_min_xv = my_graph.disp_max_xv - delta;
      target_disp_ttl = target_disp_max_ttl;
      limitGraph();
      my_graph.dirty = true;
      getDataBlock(BLOCK_MINUTE,SRC_KRAK,my_graph.coin,my_graph,block_n,function()
      {
        delta = my_graph.disp_max_xv-my_graph.disp_min_xv;
        target_disp_max_xv = my_graph.xv[my_graph.xv.length-1];
        target_disp_min_xv = my_graph.disp_max_xv - delta;
        target_disp_ttl = target_disp_max_ttl;
        aggregatePurchases(my_graph);
        limitGraph();
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

    var inert_callback = function(graph)
    {
      aggregatePurchases(graph);
      limitGraph();
    }
    var callback = function(graph)
    {
      graph.clampDisp();
      graph.disp_min_xv = graph.disp_max_xv-day;
      graph.span = DAY;
      graph.disp_min_yv = 0;
      graph.disp_max_yv *= 1.1;
      target_disp_min_xv = graph.disp_min_xv;
      target_disp_max_xv = graph.disp_max_xv;
      for(var i = 0; i < COIN_COUNT; i++)
      {
        target_disp_min_yv[i] = graphs[0][i].disp_min_yv;
        target_disp_max_yv[i] = graphs[0][i].disp_max_yv;
      }

      aggregatePurchases(graph);
      limitGraph();
    }
    for(var i = 0; i < SRC_COUNT; i++)
      for(var j = 0; j < COIN_COUNT; j++)
        for(var k = 0; k < BLOCK_COUNT; k++)
        {
          switch(i)
          {
            case 0: getDataBlock(k,i,j,graphs[i][j],block_n,callback); break;
            case 1: getDataBlock(k,i,j,graphs[i][j],block_n,inert_callback); break;
          }
        }

    callback = function(graph)
    {
      graph.clampDisp();
    }
    for(var i = 0; i < 1; i++)
    {
      setTimeout(function(i){return function(){getPressureDataBlock((i+1),COIN_ETH,eth_pressure_graph,callback)}}(i),1000*(i+1));
    }
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
    clicker.filter(cmd_btn);
    clicker.filter(alt_btn);
    clicker.filter(show_btn);
    clicker.filter(auto_btn);
    clicker.filter(left_btn);
    clicker.filter(right_btn);
    clicker.filter(load_latest_btn);
    clicker.filter(enhance_btn);
    clicker.flush();
    keyer.filter(keys);
    keyer.flush();

    if(req_q.length)
    {
      if(new Date()-req_t > sec)
      {
        req_q[0].send();
        req_q.splice(0,1);
        req_t = new Date();
      }
    }

    left_val  = my_graph.findqueryx(my_graph.disp_min_xv);
    right_val = my_graph.findqueryx(my_graph.disp_max_xv);
    span_delta = right_val-left_val;
    span_delta_p = span_delta/left_val;

    if(target_disp_ttl > 0)
    {
      my_graph.disp_min_xv = lerp(my_graph.disp_min_xv,target_disp_min_xv,0.3);
      my_graph.disp_max_xv = lerp(my_graph.disp_max_xv,target_disp_max_xv,0.3);
      for(var i = 0; i < COIN_COUNT; i++)
      {
        graphs[0][i].disp_min_yv = lerp(graphs[0][i].disp_min_yv,target_disp_min_yv[i],0.3);
        graphs[0][i].disp_max_yv = lerp(graphs[0][i].disp_max_yv,target_disp_max_yv[i],0.3);
      }
      alignGraphs();
      limitGraph();
      target_disp_ttl--;
    }
    if(target_disp_ttl == 0)
    {
      my_graph.disp_min_xv = target_disp_min_xv;
      my_graph.disp_max_xv = target_disp_max_xv;
      for(var i = 0; i < COIN_COUNT; i++)
      {
        graphs[0][i].disp_min_yv = target_disp_min_yv[i];
        graphs[0][i].disp_max_yv = target_disp_max_yv[i];
      }
      alignGraphs();
      limitGraph();
    }

    if(auto_purchases)
    {
      auto_countdown--;
      if(auto_countdown <= 0)
      {
        auto_countdown = auto_max_countdown;
        load_latest_btn.click({});
      }
    }
  };

  self.draw = function()
  {
    var delta = span_delta;
    var p = span_delta_p;
    var arc_r = 5;
    var val;
    var amt;

    my_graph.draw(ctx);
    for(var i = 0; i < SRC_COUNT; i++)
      for(var j = 0; j < COIN_COUNT; j++)
        if(j != my_graph.coin)
          graphs[i][j].draw(ctx);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(my_graph.x,my_graph.y,my_graph.w,my_graph.h);
    for(var i = 0; i < SRC_COUNT; i++)
      graphs[i][my_graph.coin].draw(ctx);
    //eth_pressure_graph.draw(ctx);

    //cur price
    ctx.fillStyle = black;
    ctx.textAlign = "right";
      //cur = right side
    if(my_graph.disp_max_xv == my_graph.xv[my_graph.xv.length-1])
    {
      ctx.strokeStyle = blue;
      ctx.beginPath();
      ctx.moveTo(my_graph.x+my_graph.w+1,my_graph.y);
      ctx.lineTo(my_graph.x+my_graph.w+1,my_graph.y+my_graph.h);
      ctx.stroke();
      ctx.strokeStyle = black;
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
      var x;
      if(left_val < right_val)
      {
        x = my_graph.x+my_graph.w-10;
        ctx.textAlign = "right";
      }
      else
      {
        x = my_graph.x+10;
        ctx.textAlign = "left";
      }
      ctx.font = s+"px Arial";
      drawOutlinedText(ticker(my_graph.coin)+" "+my_graph.total_owned, x, my_graph.y+my_graph.h-10-s*3, 1, ctx);
      drawOutlinedText("(@ $"+fdisp(my_graph.total_spent_val/my_graph.total_owned)+")", x, my_graph.y+my_graph.h-10-s*2, 1, ctx);
      var delta = my_graph.total_owned_val-my_graph.total_spent_val;
      var p = delta/my_graph.total_spent_val;
      drawOutlinedText("$"+fdisp(my_graph.total_spent_val)+" -> $"+fdisp(my_graph.total_owned_val), x, my_graph.y+my_graph.h-10-s*1, 1, ctx);
      if(delta > 0)
      {
        ctx.fillStyle = green;
        drawOutlinedText("+$"+fdisp(delta)+" (+"+fdisp(p*100)+"%)", x, my_graph.y+my_graph.h-10-s*0, 1, ctx);
      }
      else
      {
        ctx.fillStyle = red;
        drawOutlinedText("-$"+fdisp(delta*-1)+" ("+fdisp(p*100)+"%)", x, my_graph.y+my_graph.h-10-s*0, 1, ctx);
      }
    }

    //hover
    ctx.textAlign = "left";
    ctx.fillStyle = black;
    ctx.font = "12px Arial";
    var x;
    var y;
    ctx.strokeStyle = blue;
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
      //start
    y = round(mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, left_val));
    ctx.strokeStyle = black;
    ctx.beginPath();
    ctx.moveTo(my_graph.x             ,y);
    ctx.lineTo(my_graph.x+my_graph.w/2,y);
    ctx.stroke();
    ctx.strokeStyle = lr_grad;
    ctx.beginPath();
    ctx.moveTo(my_graph.x+my_graph.w/2,y);
    ctx.lineTo(my_graph.x+my_graph.w  ,y);
    ctx.stroke();

      //end
    //val = my_graph.findqueryx(my_graph.disp_max_xv);
    y = round(mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, right_val));
    ctx.strokeStyle = black;
    ctx.beginPath();
    ctx.moveTo(my_graph.x+my_graph.w/2,y);
    ctx.lineTo(my_graph.x+my_graph.w  ,y);
    ctx.stroke();
    ctx.strokeStyle = rl_grad;
    ctx.beginPath();
    ctx.moveTo(my_graph.x             ,y);
    ctx.lineTo(my_graph.x+my_graph.w/2,y);
    ctx.stroke();

    //purchases
    ctx.strokeStyle = blue;
    ctx.lineWidth = 0.5;
    var tick = ticker(my_graph.coin);
    if(purchases && purchases[tick] && show_purchases)
    {
      var closest_i = -1;
      var closest_x = 999999999;
      var closest_y = 0;
      var closest_val = 0;

      val = my_graph.total_spent_val/my_graph.total_owned;
      y = mapVal(my_graph.disp_min_yv, my_graph.disp_max_yv, my_graph.y+my_graph.h, my_graph.y, val);
      ctx.strokeStyle = green;
      ctx.strokeStyle = red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(my_graph.x-arc_r*2,y);
      ctx.lineTo(my_graph.x+arc_r*2,y);
      ctx.moveTo(my_graph.x+my_graph.w-arc_r*2,y);
      ctx.lineTo(my_graph.x+my_graph.w+arc_r*2,y);
      ctx.stroke();

      ctx.lineWidth = 0.5;
      for(var i = 0; i < purchases[tick].length; i++)
      {
        val = purchases[tick][i].rate;
        amt = purchases[tick][i].amt;

        if(amt < 0) ctx.strokeStyle = red;
        else        ctx.strokeStyle = green;

        x = mapVal(my_graph.disp_min_xv, my_graph.disp_max_xv, my_graph.x, my_graph.x+my_graph.w, purchases[tick][i].ts);
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
        drawOutlinedText(tick+" "+fdisp(purchases[tick][i].amt)+" @ $"+fdisp(val), x+xoff,y+30, 1, ctx);
        var spent = purchases[tick][i].spent;
        var have = purchases[tick][i].amt*my_graph.yv[my_graph.yv.length-1];
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
        drawOutlinedText(dateToString(new Date(purchases[tick][i].ts*1000)),x+xoff,y+75, 1, ctx);
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
    ctx.strokeStyle = black;
    drawbtntitle(eth_btn,ticker(COIN_ETH),my_graph.coin == COIN_ETH);
    drawbtntitle(btc_btn,ticker(COIN_BTC),my_graph.coin == COIN_BTC);
    drawbtntitle(ltc_btn,ticker(COIN_LTC),my_graph.coin == COIN_LTC);
    drawbtntitle(hr_btn,"hr",my_graph.span == HR);
    drawbtntitle(day_btn,"day",my_graph.span == DAY);
    drawbtntitle(week_btn,"week",my_graph.span == WEEK);
    drawbtntitle(month_btn,"month",my_graph.span == MONTH);
    //drawbtntitle(cmd_btn,"cmd",keys.cmd);
    drawbtntitle(alt_btn,"alt",keys.alt);
    //drawbtntitle(show_btn,"show",show_purchases);
    if(auto_purchases)
    {
      ctx.fillStyle = blue;
      ctx.fillRect(auto_btn.x,auto_btn.y,auto_btn.w*(auto_countdown/auto_max_countdown),auto_btn.h);
    }
    drawbtntitle(auto_btn,"auto",false);
    drawbtntitle(left_btn,"left",false);
    drawbtntitle(right_btn,"right",false);
    if(loading_latest) drawbtntitle(load_latest_btn,"");
    if(enhancing)      drawbtntitle(enhance_btn,"");
  };
  var drawbtntitle = function(btn,title,fill)
  {
    if(fill)
    {
      ctx.fillStyle = blue;
      ctx.fillRect(btn.x,btn.y,btn.w,btn.h);
    }
    ctx.strokeRect(btn.x,btn.y,btn.w,btn.h);
    ctx.fillStyle = black;
    drawOutlinedText(title, btn.x+2, btn.y+btn.h-2, 1, ctx);
    drawOutlinedText(title, btn.x+2, btn.y+btn.h-2, 1, ctx);
  }

  self.cleanup = function()
  {
  };

};

