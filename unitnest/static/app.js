(function(){
  var U = window.UNITS || {};
  function toC(v,u){return u==='c'?v:u==='f'?(v-32)*5/9:v-273.15}
  function fromC(c,u){return u==='c'?c:u==='f'?c*9/5+32:c+273.15}
  function conv(v,a,b){
    if(U[a].t==='temperature') return fromC(toC(v,a),b);
    return v*U[a].f/U[b].f;
  }
  function fmt(x){
    if(!isFinite(x)) return '';
    var d = Math.abs(x)>=100?2:Math.abs(x)>=1?3:5;
    return parseFloat(x.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d});
  }
  document.querySelectorAll('.conv').forEach(function(w){
    var a=w.dataset.from,b=w.dataset.to,i=w.querySelector('.conv-in'),o=w.querySelector('.conv-out');
    function run(){var v=parseFloat(i.value);o.value=isNaN(v)?'':fmt(conv(v,a,b));}
    i.addEventListener('input',run);run();
    w.querySelector('.conv-swap').addEventListener('click',function(){location.href=this.dataset.href;});
  });
})();
