class Sprite {
    constructor({position, imageSrc, scale = 1}) {
      this.position = position
      this.image = new Image()
      this.image.src = imageSrc
      this.scale = scale
      this.isLoaded = false
      
      this.image.onload = () => {
        this.isLoaded = true
        console.log('Afbeelding geladen!', imageSrc)
      }
      
      this.image.onerror = () => {
        console.error('Fout bij laden:', imageSrc)
      }
    }

    draw() {
        if (this.isLoaded) {
            c.drawImage(
                this.image,
                this.position.x, 
                this.position.y,
                canvas.width,
                canvas.height
            )
        }
    }

    update() {
        this.draw()
    }
}

class Fighter {
    constructor({position, velocity, color = 'red', offset, imageSrc, scale = 1, width = 100, height = 200 }) {
      this.position = position
      this.velocity = velocity
      this.width = width
      this.height = height
      this.lastKey
      this.attackBox = {
        position: {
          x: this.position.x,
          y: this.position.y
        },
        offset,
        width: 100,
        height: 50 
      }
      this.color = color
      this.isAttacking = false
      this.health = 100
      this.image = imageSrc ? new Image() : null
      this.scale = scale
      this.isLoaded = false
      
      if (imageSrc) {
        this.image.src = imageSrc
        this.image.onload = () => {
          this.isLoaded = true
          console.log('Fighter afbeelding geladen!', imageSrc)
        }
        this.image.onerror = () => {
          console.error('Fout bij laden fighter:', imageSrc)
        }
      }
    }

    draw() {
        if (this.image && this.isLoaded) {
            c.drawImage(
                this.image,
                this.position.x,
                this.position.y,
                this.width * this.scale,
                this.height * this.scale
            )
        } else {
            c.fillStyle = this.color
            c.fillRect(this.position.x, this.position.y, this.width, this.height)
        }
    }

    update() {
        this.draw()
        this.attackBox.position.x = this.position.x + this.attackBox.offset.x
        this.attackBox.position.y = this.position.y
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        // Horizontale grenzen - links
        if (this.position.x < 0) {
            this.position.x = 0
        }
        
        // Horizontale grenzen - rechts
        if (this.position.x + this.width > canvas.width) {
            this.position.x = canvas.width - this.width
        }

        // Verticale grenzen - bovenkant
        if (this.position.y < 0) {
            this.position.y = 0
            this.velocity.y = 0
        }

        // Verticale grenzen - bodem
        if (this.position.y + this.height >= groundLevel) {
            this.velocity.y = 0
            this.position.y = groundLevel - this.height
        } else {
            this.velocity.y += gravity
        }
    }

    attack() {
        this.isAttacking = true
        setTimeout(() => {
            this.isAttacking = false
        }, 100)
    }
}