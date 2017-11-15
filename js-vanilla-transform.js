class VanillaTransform {
    constructor(node,data) {

        /* Use data*/
        this.$image = node;
        this.color = (data && data.color) ? data.color : 'black';

        /* Preparing DOM */
        this.DOMprepare();

        this.setEvents();
        this.resizeMatrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.rotateMatrix = null;
        this.initialDistance = Math.sqrt(Math.pow(this.$image.width,2)+Math.pow(this.$image.height,2))/2;
        this.distance = this.initialDistance;
        this.angle = null;
    }

    DOMprepare(){
        var self = this;

        /* Styling for image */
        this.$image.style.display = 'block';
        this.$image.style.border = '1px solid '+this.color;
        this.$image.style.userSelect = 'none';
        this.$image.style.userDrag = 'none';

        /* Create image wrapper */
        this.$imageWrap = document.createElement('div');
        this.$imageWrap.style.position = 'absolute';
        this.$imageWrap.style.transformOrigin = 'center';
        this.$imageWrap.style.userSelect = 'none';
        this.$image.parentNode.insertBefore(this.$imageWrap, this.$image);
        this.$imageWrap.appendChild(this.$image);

        /* Create control container */
        this.$controls = document.createElement('div');
        this.$controls.style.height = '100%';

        /* Create resize areas */
        ['nw','ne','se','sw'].forEach(function(elem){
            var current = document.createElement('div');
            current.style.width = '10px';
            current.style.height = '10px';
            current.style.background = self.color;
            current.style.display = 'block';
            current.style.position = 'absolute';
            current.style.cursor = 'pointer';
            switch (elem) {
                case 'nw':
                    current.style.top = '-10px';
                    current.style.left = '-10px';
                    break;
                case 'ne':
                    current.style.top = '-10px';
                    current.style.right = '-10px';
                    break;
                case 'se':
                    current.style.bottom = '-10px';
                    current.style.right = '-10px';
                    break;
                case 'sw':
                    current.style.bottom = '-10px';
                    current.style.left = '-10px';
                    break;
            }
            current.dataset.action = 'resize';
            self.$controls.appendChild(current);
        });

        /* Create rotate area */
        var rotate = document.createElement('div');
        rotate.dataset.action = 'rotate';
        rotate.style.width = '10px';
        rotate.style.height = '10px';
        rotate.style.borderRadius = '50%';
        rotate.style.display = 'block';
        rotate.style.background = this.color;
        rotate.style.position = 'absolute';
        rotate.style.top = '-10px';
        rotate.style.left = '49%';
        rotate.style.cursor = 'pointer';

        this.$controls.appendChild(rotate);
        this.$imageWrap.appendChild(this.$controls);
    }

    checkAction(e) {
        switch (this.action) {
            case "resize":
                this.resize(e);
                break;
            case "rotate":
                this.rotate(e);
                break;
        }
        this.setStyle();
    }

    resize(e) {
        var $i = this.$image,
            cX = $i.x+$i.width/2,
            xY = $i.y+$i.height/2;
        this.prevDistance = this.distance;
        this.distance = Math.sqrt(Math.pow(e.clientX-cX,2)+Math.pow(e.clientY-xY,2));
        this.setResizeMatrix();
    }

    rotate(e) {
        var $i = this.$image;
        this.angle = Math.atan2(
                e.clientY - ($i.y + $i.height / 2),
                e.clientX - ($i.x + $i.width / 2)
            )+Math.PI/2;
        this.setRotateMatrix(this.angle);
    }

    setResizeMatrix(){
        var resizeDiff = this.distance/this.initialDistance;
        this.resizeMatrix = [[resizeDiff, 0, 0], [0, resizeDiff, 0], [0, 0, 1]];
    }

    setRotateMatrix(a) {
        a *= -1;
        this.rotateMatrix = [
            [Math.cos(a), -Math.sin(a), 0],
            [Math.sin(a), Math.cos(a), 0],
            [0, 0, 1]
        ];
    }

    setStyle() {
        var m;
        if (this.resizeMatrix && this.rotateMatrix) {
            m = this.multiplyMatrix(this.resizeMatrix, this.rotateMatrix);
        } else {
            m = !this.resizeMatrix ? this.rotateMatrix : this.resizeMatrix;
        }
        this.$imageWrap.style.transform = `matrix(${m[0][0]},${m[0][1]},${m[1][0]},${m[1][1]},${m[2][0]},${m[2][1]})`;
    }

    setEvents() {
        this.$controls.addEventListener("mousedown", e => {
            this.action = e.target.dataset.action;
            this.pressed = true;
        });
        document.addEventListener("mouseup", e => {
            this.pressed = false;
            this.dragging = false;
            this.$image.draggable = true;
        });
        document.addEventListener("mousemove", e => {
            if (this.pressed) this.checkAction(e);
        });
        this.$image.addEventListener("mousedown", e => {
            if (this.detectLeftButton(e)){
                this.$image.draggable = false;
                this.dragging = true;
                this.dragX = this.$imageWrap.offsetLeft - e.clientX;
                this.dragY = this.$imageWrap.offsetTop - e.clientY;
            }
        });
        this.$image.addEventListener("mousemove", e => {
            if (this.dragging){
                var cX = e.clientX - this.$imageWrap.offsetLeft + this.dragX,
                    cY = e.clientY - this.$imageWrap.offsetTop + this.dragY;
                this.$imageWrap.style.top = cY + this.$imageWrap.offsetTop+'px';
                this.$imageWrap.style.left = cX + this.$imageWrap.offsetLeft+'px';
            }
        });
    }

    detectLeftButton(e) {
        e = e || window.event;
        if ("buttons" in e) {
            return e.buttons == 1;
        }
        var button = e.which || e.button;
        return button == 1;
    }

    multiplyMatrix(a, b) {
        var aNumRows = a.length,
            aNumCols = a[0].length,
            bNumRows = b.length,
            bNumCols = b[0].length,
            m = new Array(aNumRows);
        for (var r = 0; r < aNumRows; ++r) {
            m[r] = new Array(bNumCols);
            for (var c = 0; c < bNumCols; ++c) {
                m[r][c] = 0;
                for (var i = 0; i < aNumCols; ++i) {
                    m[r][c] += a[r][i] * b[i][c];
                }
            }
        }
        return m;
    }
}

export default VanillaTransform;