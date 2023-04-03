drag = simulation => {
  
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.5).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;

    //   triggerNodeCreation.call(this, event, d)
    }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }

function triggerNodeCreation(e, d) {

    var nodeContent = $(this).children("textarea").val()

    if(nodeContent.length < 7)
        return

    var newNodeRef = {
        name: "", children:[], requestPrompt: nodeContent 
    }
        
    d.children.push(newNodeRef)

    render_graph(data)
}

const zoom = d3.zoom()
  .scaleExtent([1,1])
  .on("zoom", zoomed);



function zoomed(event) {
    const {transform} = event;

    gLinks.attr("transform", transform);

    gNodes
        .style("left", transform.x + "px")
        .style("top", transform.y + "px")
}

const svg = d3.select("svg")

svg.call(zoom);

//const g = svg.append("g");
const gNodes = d3.select("#nodes-div");
const gLinks = d3.select("#link-placeholder");


zoom.translateBy(svg, window.innerWidth / 2, window.innerHeight / 2)

function render_graph(data) {


    const root = d3.hierarchy(data);
    
    var nodesRaw = root.descendants()
    var nodes = []
    for(var i in nodesRaw)
        nodes.push(nodesRaw[i].data)

    const links = root.links();
    for(var i in links) {
        links[i].source = links[i].source.data
        links[i].target = links[i].target.data
    }

  
    const simulation = d3.forceSimulation(nodes)
        // .force("link", d3.forceLink(links).id(d => d.id).distance(100).strength(1))
        .force("link", d3.forceLink(links).id(d => d.id).distance(400))
        .force("charge", d3.forceManyBody().strength(-500))
        // .force("x", d3.forceX())
        // .force("y", d3.forceY());
  
    const link = d3.select("#link-placeholder")
        .selectAll("line")
        .data(links, d=>d.index)
        .join("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)

    d3.selectAll(".content-text")
        .attr("disabled", true)


    var nodeGroup = d3.select("#nodes-div")
        .selectAll(".node-elem")
        .data(nodes, function(d){
            // console.log(d)
            return d.index
        })
        .join(function(enter) {
            var ng = enter.append("div")

            


            var ngTextArea = ng.append("textarea")
                .attr("class", "content-text")
                .attr("disabled", true)
                .style("height", _ => this.scrollHeight + "px;overflow-y:hidden;")
                .on("input", function () {
                    d3.select(this).style("height", 0)
                    d3.select(this).style("height", this.scrollHeight + "px")
                });

                ng.append("button")
                    .text("+")
                    .on("click", function(e, d) {
                        var parentElement = $(this).parent().get(0)
                        triggerNodeCreation.call(parentElement, null, d)
                    })

            ng.attr("class", "node-elem")
                .call(drag(simulation))
                

            ngTextArea.each(function(d){

                var taRef = this

                if(!("requestPrompt" in d))
                    return
            
                getRelatedContent(d.requestPrompt, 1)
                    .then(function(respList) {

                        var fillContent = respList[0]

                        var nodeFillTextIdx = 0

                        var nodeFillIntervalRef = setInterval(function(){

                            if(nodeFillTextIdx >= fillContent.length)
                                clearInterval(nodeFillIntervalRef)
                            else {
                                taRef.value += fillContent[nodeFillTextIdx]
                                nodeFillTextIdx += 1

                                //Autosize
                                d3.select(taRef).style("height", 0)
                                d3.select(taRef).style("height", taRef.scrollHeight + "px")
                            }
        
                        }, 50)

                
                    })
                    .catch(function(r) {
                        alert(r.responseText)
                    })
            
            })
                



        })


    
            

  
    simulation.on("tick", () => {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
  
        d3.selectAll(".node-elem")
            .style("top", d => d.y + "px")
            .style("left", d => d.x + "px")

    });

}